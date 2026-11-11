import { describe, expect, test } from "bun:test";
import { applyCrmOwnership, buildCrmScope } from "../src/lib/crud-scope";

describe("CRM object-level scope", () => {
  const counselor = { id: "counselor-1", role: "COUNSELOR", branchId: "branch-1" };

  test("counselor lists are restricted to assigned leads and students", () => {
    expect(buildCrmScope("leads", counselor)).toEqual({ counselorId: "counselor-1" });
    expect(buildCrmScope("students", counselor)).toEqual({ counselorId: "counselor-1" });
  });

  test("related CRM records are scoped through assigned student, lead, or assignee", () => {
    expect(buildCrmScope("applications", counselor)).toEqual({
      OR: [
        { assignedTo: "counselor-1" },
        { student: { is: { counselorId: "counselor-1" } } },
      ],
    });
    expect(buildCrmScope("documents", counselor)).toEqual({
      student: { is: { counselorId: "counselor-1" } },
    });
    expect(buildCrmScope("appointments", counselor)).toEqual({ assigneeId: "counselor-1" });
  });

  test("unknown role/entity combinations fail closed", () => {
    expect(buildCrmScope("users", counselor)).toEqual({ id: "__no_counselor_scope__" });
    expect(buildCrmScope("leads", { id: "student-1", role: "STUDENT" })).toEqual({
      id: "__no_scope_for_role__",
    });
  });

  test("student notification scope is limited to the session owner", () => {
    expect(buildCrmScope("notifications", { id: "student-1", role: "STUDENT" })).toEqual({
      userId: "student-1",
    });
  });

  test("administrator scope is unrestricted only for the admin route", () => {
    expect(buildCrmScope("leads", { id: "admin-1", role: "ADMIN" })).toBeNull();
    expect(buildCrmScope("leads", { id: "root-1", role: "SUPER_ADMIN" })).toBeNull();
  });

  test("ownership comes from the authenticated user, not request fields", () => {
    expect(applyCrmOwnership("leads", {
      name: "A learner",
      counselorId: "attacker-id",
      branchId: "another-branch",
      partnerId: "untrusted-partner",
    }, counselor)).toEqual({
      name: "A learner",
      counselorId: "counselor-1",
      branchId: "branch-1",
      partnerId: null,
    });
    expect(applyCrmOwnership("tasks", { assigneeId: "attacker-id" }, counselor)).toEqual({
      assigneeId: "counselor-1",
    });
  });
});
