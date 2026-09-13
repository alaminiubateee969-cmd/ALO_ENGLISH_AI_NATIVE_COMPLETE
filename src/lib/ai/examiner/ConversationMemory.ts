/**
 * src/lib/ai/examiner/ConversationMemory.ts
 *
 * Short-term conversation memory for the AI examiner.
 *
 * Tracks the conversation history so the examiner can:
 *   - Reference what the student said earlier
 *   - Avoid repeating questions
 *   - Generate context-aware follow-ups
 *   - Build a running summary of topics covered
 *
 * Privacy: all data is session-scoped, never persisted to the database
 * during the live exam. Only stored in memory and discarded after the
 * exam session ends.
 */

import type { ConversationTurn } from "./ExaminerEngine";

export type ConversationSummary = {
  studentName: string | null;
  hometown: string | null;
  occupation: string | null;
  topicsCovered: string[];
  keywords: string[];
  totalStudentTurns: number;
  totalExaminerTurns: number;
  durationSec: number;
};

export class ConversationMemory {
  private history: ConversationTurn[];
  private startTime: number;

  constructor(history: ConversationTurn[] = []) {
    this.history = history;
    this.startTime = history.length > 0
      ? new Date(history[0].timestamp).getTime()
      : Date.now();
  }

  /**
   * Get the most recent N turns of conversation.
   */
  getRecentTurns(n: number): ConversationTurn[] {
    return this.history.slice(-n);
  }

  /**
   * Get all conversation history.
   */
  getFullHistory(): ConversationTurn[] {
    return this.history;
  }

  /**
   * Get only the student's answers.
   */
  getStudentTurns(): ConversationTurn[] {
    return this.history.filter((t) => t.role === "student");
  }

  /**
   * Get only the examiner's questions/statements.
   */
  getExaminerTurns(): ConversationTurn[] {
    return this.history.filter((t) => t.role === "examiner");
  }

  /**
   * Build a summary of the conversation for context.
   * Extracts: student name, hometown, occupation, topics covered, keywords.
   */
  getSummary(): ConversationSummary {
    const studentTexts = this.getStudentTurns().map((t) => t.text);
    const combined = studentTexts.join(" ");
    const lower = combined.toLowerCase();

    // Extract name (look for "my name is X" or "I'm X" patterns)
    let studentName: string | null = null;
    const nameMatch = combined.match(/(?:my name is|i am|i'm|this is)\s+([A-Z][a-z]+)/);
    if (nameMatch) studentName = nameMatch[1];

    // Extract hometown
    let hometown: string | null = null;
    const hometownMatch = combined.match(/(?:from|live in|born in)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/);
    if (hometownMatch) hometown = hometownMatch[1];

    // Extract occupation
    let occupation: string | null = null;
    const occMatch = combined.match(/(?:work as|study|studying|working)\s+(?:as\s+)?(?:a\s+)?([a-z\s]{3,30})/i);
    if (occMatch) occupation = occMatch[1].trim();

    // Extract keywords (non-stopwords that appear multiple times)
    const keywords = this.extractKeywords(combined);

    // Track topics covered based on keywords
    const topicsCovered = this.detectTopics(lower);

    return {
      studentName,
      hometown,
      occupation,
      topicsCovered,
      keywords,
      totalStudentTurns: this.getStudentTurns().length,
      totalExaminerTurns: this.getExaminerTurns().length,
      durationSec: Math.round((Date.now() - this.startTime) / 1000),
    };
  }

  /**
   * Get a brief context string for the LLM prompt.
   */
  getSummaryString(): string {
    const s = this.getSummary();
    const parts: string[] = [];
    if (s.studentName) parts.push(`Student name: ${s.studentName}`);
    if (s.hometown) parts.push(`Hometown: ${s.hometown}`);
    if (s.occupation) parts.push(`Occupation/studies: ${s.occupation}`);
    if (s.topicsCovered.length > 0) parts.push(`Topics covered: ${s.topicsCovered.join(", ")}`);
    parts.push(`Student turns so far: ${s.totalStudentTurns}`);
    return parts.join(" | ");
  }

  /**
   * Check if a topic has already been discussed.
   */
  hasTopic(topic: string): boolean {
    return this.getSummary().topicsCovered.some((t) =>
      t.toLowerCase().includes(topic.toLowerCase())
    );
  }

  /**
   * Add a new turn to memory.
   */
  addTurn(turn: ConversationTurn): void {
    this.history.push(turn);
  }

  /**
   * Extract keywords from text (filter stopwords).
   */
  private extractKeywords(text: string): string[] {
    const stopwords = new Set([
      "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
      "have", "has", "had", "do", "does", "did", "will", "would", "could",
      "should", "may", "might", "must", "can", "shall", "need", "dare",
      "to", "of", "in", "for", "on", "with", "at", "by", "from", "as",
      "into", "through", "during", "before", "after", "above", "below",
      "and", "or", "but", "if", "then", "else", "when", "where", "why",
      "how", "all", "any", "each", "few", "more", "most", "other", "some",
      "i", "you", "he", "she", "we", "they", "me", "him", "her", "us",
      "my", "your", "his", "its", "our", "their", "this", "that", "these",
      "those", "what", "which", "who", "whom", "am", "it", "so", "very",
      "just", "also", "about", "there", "here", "not", "no", "yes",
    ]);

    const words = text.toLowerCase().split(/\s+/).filter((w) => {
      const clean = w.replace(/[^a-z']/g, "");
      return clean.length > 2 && !stopwords.has(clean);
    });

    // Count word frequency
    const freq = new Map<string, number>();
    for (const word of words) {
      freq.set(word, (freq.get(word) || 0) + 1);
    }

    // Return top keywords (frequency > 1)
    return Array.from(freq.entries())
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Detect high-level topics from the conversation.
   */
  private detectTopics(lowerText: string): string[] {
    const topicMap: Record<string, string[]> = {
      "hometown": ["hometown", "where i'm from", "born in", "grew up", "home city"],
      "family": ["family", "parents", "siblings", "brother", "sister", "mother", "father"],
      "work": ["work", "job", "office", "company", "career", "profession"],
      "studies": ["study", "studying", "university", "college", "school", "degree", "subject"],
      "hobbies": ["hobby", "hobbies", "free time", "leisure", "pastime"],
      "travel": ["travel", "trip", "journey", "visit", "visited", "vacation", "holiday"],
      "food": ["food", "eat", "cooking", "restaurant", "dish", "meal"],
      "music": ["music", "song", "sing", "instrument", "band"],
      "sports": ["sport", "play", "football", "cricket", "game", "exercise"],
      "technology": ["technology", "computer", "phone", "internet", "app"],
    };

    const topics: string[] = [];
    for (const [topic, keywords] of Object.entries(topicMap)) {
      if (keywords.some((kw) => lowerText.includes(kw))) {
        topics.push(topic);
      }
    }
    return topics;
  }
}
