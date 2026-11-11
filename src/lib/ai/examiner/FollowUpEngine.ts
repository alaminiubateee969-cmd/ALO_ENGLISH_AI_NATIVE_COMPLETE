/**
 * src/lib/ai/examiner/FollowUpEngine.ts
 *
 * Context-aware follow-up question generator.
 *
 * Analyzes the student's latest answer and the conversation state to
 * suggest a relevant follow-up direction for the examiner. This is a
 * HINT passed to the LLM — the LLM has final say on the actual wording.
 *
 * The engine uses keyword detection and topic mapping to suggest
 * follow-ups that:
 *   - Relate to what the student just said (not generic)
 *   - Match the current exam part (Part 1/2/3 have different styles)
 *   - Avoid repeating previously asked questions
 */

import type { ExaminerState } from "./ExaminerStateMachine";
import type { ConversationSummary } from "./ConversationMemory";

export class FollowUpEngine {
  /**
   * Suggest a follow-up direction based on the student's transcript,
   * current state, and conversation summary.
   *
   * Returns a short hint string, or null if no suggestion is needed.
   */
  static suggestFollowUp(
    transcript: string,
    state: ExaminerState,
    summary: ConversationSummary
  ): string | null {
    const lower = transcript.toLowerCase();

    // Part 1: personal questions about familiar topics
    if (state === "part1_questions") {
      return this.suggestPart1FollowUp(lower, summary);
    }

    // Part 2 long turn: encourage elaboration
    if (state === "part2_long_turn") {
      return this.suggestPart2LongTurnFollowUp(lower, summary);
    }

    // Part 2 follow-up: ask a related question
    if (state === "part2_followup") {
      return this.suggestPart2FollowUp(lower);
    }

    // Part 3: abstract discussion questions
    if (state === "part3_discussion") {
      return this.suggestPart3FollowUp(lower, summary);
    }

    // Introduction: ask about themselves
    if (state === "introduction") {
      if (lower.includes("name") && !summary.studentName) {
        return "Ask for their name first.";
      }
      if (summary.studentName && !summary.hometown) {
        return `The student's name is ${summary.studentName}. Ask where they are from.`;
      }
      if (summary.hometown && !summary.occupation) {
        return `They are from ${summary.hometown}. Ask what they do (work or study).`;
      }
    }

    return null;
  }

  /**
   * Part 1 follow-up suggestions (familiar topics).
   */
  private static suggestPart1FollowUp(
    lowerText: string,
    summary: ConversationSummary
  ): string | null {
    // If student mentioned a hobby, dig deeper
    if (lowerText.includes("hobby") || lowerText.includes("free time")) {
      if (!summary.topicsCovered.includes("hobbies")) {
        return "Ask what they enjoy doing in their free time.";
      }
      return "Ask how long they've had this hobby and why they enjoy it.";
    }

    // If student mentioned family
    if (lowerText.includes("family") || lowerText.includes("brother") || lowerText.includes("sister")) {
      return "Ask about their family — how many people, or what their family enjoys doing together.";
    }

    // If student mentioned work/studies
    if (lowerText.includes("work") || lowerText.includes("job")) {
      return "Ask what they like most about their work, or what their typical day looks like.";
    }
    if (lowerText.includes("study") || lowerText.includes("university") || lowerText.includes("student")) {
      return "Ask what subject they're studying and why they chose it.";
    }

    // If student mentioned hometown
    if (lowerText.includes("hometown") || lowerText.includes("from")) {
      return "Ask what they like about their hometown, or how it's different from where they live now.";
    }

    // Default: suggest a new Part 1 topic if they've answered a few questions
    if (summary.totalStudentTurns >= 2 && !summary.topicsCovered.includes("hobbies")) {
      return "Transition to hobbies — ask what they enjoy doing in their free time.";
    }
    if (summary.totalStudentTurns >= 3 && !summary.topicsCovered.includes("food")) {
      return "Transition to food — ask about their favorite food or a typical Bangladeshi dish.";
    }

    return "Ask a natural follow-up based on what they just said.";
  }

  /**
   * Part 2 long turn: encourage the student to keep speaking or elaborate.
   */
  private static suggestPart2LongTurnFollowUp(
    lowerText: string,
    summary: ConversationSummary
  ): string | null {
    // If the answer is very short, encourage elaboration
    if (lowerText.length < 50) {
      return "The student's answer is brief. Gently encourage them to elaborate — ask 'Can you tell me more about that?' or 'What happened next?'";
    }

    // If they mentioned who they traveled with
    if (lowerText.includes("family") || lowerText.includes("friend") || lowerText.includes("alone")) {
      return "Ask them to describe an interesting moment from the journey with their travel companion(s).";
    }

    // If they mentioned an activity
    if (lowerText.includes("visit") || lowerText.includes("see") || lowerText.includes("went")) {
      return "Ask them to describe a specific place they visited and what made it special.";
    }

    // If they mentioned feelings
    if (lowerText.includes("memorable") || lowerText.includes("special") || lowerText.includes("enjoy")) {
      return "Ask why this journey was particularly memorable for them.";
    }

    return "Encourage them to continue speaking for the full 2 minutes. Ask them to elaborate on a detail.";
  }

  /**
   * Part 2 follow-up question (after the long turn).
   */
  private static suggestPart2FollowUp(lowerText: string): string | null {
    const followUps = [
      "Ask if they would like to take a similar journey again in the future.",
      "Ask whether they prefer travelling alone or with other people.",
      "Ask what they would do differently if they took the same journey again.",
      "Ask if they think this journey changed them in any way.",
    ];
    return followUps[Math.floor(Math.random() * followUps.length)];
  }

  /**
   * Part 3: abstract discussion questions related to travel/journeys.
   */
  private static suggestPart3FollowUp(
    lowerText: string,
    summary: ConversationSummary
  ): string | null {
    const discussionQuestions = [
      "Ask how travel has changed in their country over the past 10-20 years.",
      "Ask whether they think technology has made travel easier or more complicated.",
      "Ask about the benefits of travelling abroad versus travelling within one's own country.",
      "Ask whether they think young people travel more now than in the past.",
      "Ask about the environmental impact of travel and whether it's a concern.",
      "Ask whether they think travel broadens the mind and helps people understand other cultures.",
      "Ask about the role of social media in how people choose travel destinations today.",
    ];

    // Pick a question that hasn't been asked yet (based on keyword overlap)
    const askedKeywords = summary.keywords;
    for (const q of discussionQuestions) {
      const qLower = q.toLowerCase();
      const hasOverlap = askedKeywords.some((k) => qLower.includes(k));
      if (!hasOverlap) return q;
    }

    return discussionQuestions[Math.floor(Math.random() * discussionQuestions.length)];
  }

  /**
   * Generate an opening question for the introduction state.
   */
  static getOpeningQuestion(): string {
    const openings = [
      "Hello, I'm an AI speaking-practice guide. Could you introduce yourself?",
      "Welcome to conversation practice. What would you like me to call you?",
    ];
    return openings[0];
  }
}
