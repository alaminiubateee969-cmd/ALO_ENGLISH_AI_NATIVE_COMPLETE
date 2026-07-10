<?php
/**
 * app/Core/Router.php — Minimal front-controller router.
 *
 * Features:
 *   - GET / POST / PUT / DELETE / PATCH route registration
 *   - Clean-URL route parameters: /student/attempts/{id}
 *   - Per-route middleware (callable or class@method)
 *   - Group-level middleware prefixing
 *   - Controller@method dispatch with DI-by-type (basic)
 *   - 404 / 405 handling
 *
 * The router is intentionally simple — it is NOT a framework, but a
 * secure and predictable dispatcher. All route resolution is whitelist-
 * based: undefined routes always 404. Controllers must enforce RBAC.
 *
 * PHP 8.2+.
 */

declare(strict_types=1);

namespace App\Core;

use App\Services\AuditService;
use App\Services\CSRFService;
use App\Services\RBACService;

final class Router
{
    /** @var array<int, array{method:string, pattern:string, handler:mixed, middleware:array<int,mixed>, name:?string}> */
    private array $routes = [];

    /** @var array<int, callable> */
    private array $globalMiddleware = [];

    private string $groupPrefix = '';
    /** @var array<int, callable|string> */
    private array $groupMiddleware = [];

    /** Register a global middleware (runs for every route). */
    public function use(callable $mw): void
    {
        $this->globalMiddleware[] = $mw;
    }

    /** Start a route group with shared prefix + middleware. */
    public function group(string $prefix, array $middleware, callable $callback): void
    {
        $previousPrefix = $this->groupPrefix;
        $previousMw = $this->groupMiddleware;
        $this->groupPrefix = $previousPrefix . $prefix;
        $this->groupMiddleware = array_merge($previousMw, $middleware);
        try {
            $callback($this);
        } finally {
            $this->groupPrefix = $previousPrefix;
            $this->groupMiddleware = $previousMw;
        }
    }

    public function get(string $path, mixed $handler, array $middleware = [], ?string $name = null): void
    {
        $this->add('GET', $path, $handler, $middleware, $name);
    }

    public function post(string $path, mixed $handler, array $middleware = [], ?string $name = null): void
    {
        $this->add('POST', $path, $handler, $middleware, $name);
    }

    public function put(string $path, mixed $handler, array $middleware = []): void
    {
        $this->add('PUT', $path, $handler, $middleware, null);
    }

    public function patch(string $path, mixed $handler, array $middleware = []): void
    {
        $this->add('PATCH', $path, $handler, $middleware, null);
    }

    public function delete(string $path, mixed $handler, array $middleware = []): void
    {
        $this->add('DELETE', $path, $handler, $middleware, null);
    }

    private function add(string $method, string $path, mixed $handler, array $middleware, ?string $name): void
    {
        $fullPath = rtrim($this->groupPrefix . $path, '/') ?: '/';
        $this->routes[] = [
            'method'     => $method,
            'pattern'    => $fullPath,
            'handler'    => $handler,
            'middleware' => array_merge($this->groupMiddleware, $middleware),
            'name'       => $name,
        ];
    }

    /** Dispatch the current request. */
    public function dispatch(?string $requestMethod = null, ?string $requestUri = null): void
    {
        $method = strtoupper($requestMethod ?? ($_SERVER['REQUEST_METHOD'] ?? 'GET'));
        // Strip query string.
        $uri = $requestUri ?? ($_SERVER['REQUEST_URI'] ?? '/');
        $uri = parse_url($uri, PHP_URL_PATH) ?? '/';
        $uri = rtrim($uri, '/') ?: '/';
        // Decode path so /student/attempt/123%204 works.
        $uri = rawurldecode($uri);

        // Run global middleware once.
        foreach ($this->globalMiddleware as $mw) {
            $mw();
        }

        $methodNotAllowed = false;
        foreach ($this->routes as $route) {
            $params = $this->match($route['pattern'], $uri);
            if ($params === false) {
                continue;
            }
            if ($route['method'] !== $method) {
                $methodNotAllowed = true;
                continue;
            }

            // Per-route middleware.
            foreach ($route['middleware'] as $mw) {
                $this->invokeMiddleware($mw);
            }

            $this->invokeHandler($route['handler'], $params);
            return;
        }

        if ($methodNotAllowed) {
            Response::json(['error' => 'Method not allowed'], 405);
        } else {
            Response::json(['error' => 'Not found'], 404);
        }
    }

    /**
     * Match a route pattern against a URI.
     * Supports {param} placeholders. Returns associative array on match
     * (empty array if no params), or false on no match.
     *
     * @return array<string,string>|false
     */
    private function match(string $pattern, string $uri): array|false
    {
        if ($pattern === $uri) {
            return [];
        }

        // Convert pattern to regex.
        $regex = preg_replace_callback(
            '/\{([A-Za-z_][A-Za-z0-9_]*)\}/',
            static fn(array $m) => '(?P<' . $m[1] . '>[^/]+)',
            $pattern
        );
        $regex = '#^' . $regex . '$#u';

        if (preg_match($regex, $uri, $matches)) {
            $params = [];
            foreach ($matches as $k => $v) {
                if (is_string($k)) {
                    $params[$k] = $v;
                }
            }
            return $params;
        }
        return false;
    }

    private function invokeMiddleware(callable|string $mw): void
    {
        if (is_callable($mw) && !is_string($mw)) {
            $mw();
            return;
        }
        $mw = (string) $mw;

        // Short-code aliases used in routes.php.
        //   'auth'                              -> AuthMiddleware::handle
        //   'csrf'                              -> CSRFMiddleware::handle
        //   'role:ADMIN,SUPER_ADMIN'            -> RoleMiddleware::handle('ADMIN','SUPER_ADMIN')
        //   'permission:english.students.manage'-> PermissionMiddleware::handle('english.students.manage')
        //   'crm_api'                           -> CrmApiMiddleware::handle
        if ($mw === 'auth') {
            \App\Middleware\AuthMiddleware::handle();
            return;
        }
        if ($mw === 'csrf') {
            \App\Middleware\CSRFMiddleware::handle();
            return;
        }
        if ($mw === 'crm_api') {
            \App\Middleware\CrmApiMiddleware::handle();
            return;
        }
        if (str_starts_with($mw, 'role:')) {
            $roles = explode(',', substr($mw, 5));
            \App\Middleware\RoleMiddleware::handle(...$roles);
            return;
        }
        if (str_starts_with($mw, 'permission:')) {
            \App\Middleware\PermissionMiddleware::handle(substr($mw, 11));
            return;
        }

        // 'ClassName' or 'ClassName@method'
        [$class, $method] = array_pad(explode('@', $mw, 2), 2, 'handle');
        $instance = new $class();
        $instance->{$method}();
    }

    /**
     * @param array<string,string> $params
     */
    private function invokeHandler(mixed $handler, array $params): void
    {
        if (is_callable($handler) && !is_string($handler)) {
            $handler($params);
            return;
        }

        if (is_string($handler)) {
            [$class, $method] = array_pad(explode('@', $handler, 2), 2, 'index');
            if (!class_exists($class)) {
                throw new \RuntimeException("Controller class not found: {$class}");
            }
            $controller = new $class();
            if (!method_exists($controller, $method)) {
                throw new \RuntimeException("Method {$class}::{$method} not found.");
            }
            $controller->{$method}($params);
            return;
        }

        throw new \RuntimeException('Invalid route handler.');
    }
}
