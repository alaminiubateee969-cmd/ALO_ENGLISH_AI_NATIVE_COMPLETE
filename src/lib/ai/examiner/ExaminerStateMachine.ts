/**
 * src/lib/ai/examiner/ExaminerStateMachine.ts
 *
 * Three-part conversational speaking-practice flow inspired by common
 * interview formats. It is not an official or standardized exam and produces
 * no score.
 *
 * The practice conversation has 3 parts:
 *   Part 1 — Introduction and familiar-topic questions
 *   Part 2 — Original practice topic card and a longer response
 *   Part 3 — Follow-up discussion questions
 *
 * States flow:
 *   introduction → part1_questions → part2_instructions → part2_preparation →
 *   part2_long_turn → part2_followup → part3_discussion → closing → completed
 */

export type ExaminerState =
  | "introduction"
  | "part1_questions"
  | "part2_instructions"
  | "part2_preparation"
  | "part2_long_turn"
  | "part2_followup"
  | "part3_discussion"
  | "closing"
  | "completed";

export type StateTransition = {
  nextState: ExaminerState;
  isComplete: boolean;
};

export class ExaminerStateMachine {
  // Min student turns before advancing each state
  private static readonly MIN_TURNS: Record<ExaminerState, number> = {
    introduction: 1,
    part1_questions: 4,
    part2_instructions: 0,
    part2_preparation: 1,
    part2_long_turn: 1,
    part2_followup: 1,
    part3_discussion: 4,
    closing: 0,
    completed: 0,
  };

  // Min answer length (chars) to count as a meaningful answer
  private static readonly MIN_ANSWER_LEN = 15;

  /**
   * Determine the next state based on current state, student turn count,
   * and the length/quality of the student's latest answer.
   */
  advance(
    currentState: ExaminerState,
    studentTurnCount: number,
    lastAnswerLength: number
  ): StateTransition {
    if (currentState === "completed") {
      return { nextState: "completed", isComplete: true };
    }

    const minTurns = ExaminerStateMachine.MIN_TURNS[currentState];
    const hasEnoughTurns = studentTurnCount >= minTurns;
    const hasMeaningfulAnswer = lastAnswerLength >= ExaminerStateMachine.MIN_ANSWER_LEN;

    const transitionMap: Record<ExaminerState, ExaminerState> = {
      introduction: "part1_questions",
      part1_questions: "part2_instructions",
      part2_instructions: "part2_preparation",
      part2_preparation: "part2_long_turn",
      part2_long_turn: "part2_followup",
      part2_followup: "part3_discussion",
      part3_discussion: "closing",
      closing: "completed",
      completed: "completed",
    };

    // States that advance immediately (no min turn check)
    const immediateStates: ExaminerState[] = ["part2_instructions", "closing"];

    if (currentState === "closing") {
      return { nextState: "completed", isComplete: true };
    }

    if (immediateStates.includes(currentState)) {
      return { nextState: transitionMap[currentState], isComplete: false };
    }

    if (hasEnoughTurns && hasMeaningfulAnswer) {
      const next = transitionMap[currentState];
      return { nextState: next, isComplete: next === "completed" };
    }

    // Stay in current state
    return { nextState: currentState, isComplete: false };
  }

  /**
   * Get the instruction for the LLM about what to do in each state.
   */
  getInstructionForState(state: ExaminerState): string {
    const instructions: Record<ExaminerState, string> = {
      introduction:
        "Introduce yourself as an AI speaking-practice guide, not an official examiner. Invite the student to share a nickname or a familiar topic they are comfortable with; do not ask for a full name, precise location, or sensitive personal details.",
      part1_questions:
        "Ask 2-3 general questions about familiar topics based on their introduction (hometown, hobbies, daily routine, studies/work). Listen to their answers and ask natural follow-ups.",
      part2_instructions:
        "Offer an original practice prompt about a memorable journey. Explain that the suggested timing is flexible practice guidance, not an official exam timer: they may take about 1 minute to prepare and speak for up to 2 minutes. Prompt: Describe a memorable journey you have taken. You may mention where you went, who you went with, what you did there, and why it was memorable.",
      part2_preparation:
        "Invite the student to take about 1 minute to prepare if helpful; make clear that the app does not enforce a timer. Ask if they're ready to begin.",
      part2_long_turn:
        "Listen to the student's response. If they pause, gently invite them to continue or elaborate without judging accent or pronunciation. Offer one brief follow-up when they are ready.",
      part2_followup:
        "Ask one follow-up question about the practice topic (e.g., 'Would you like to go there again?' or 'Do you prefer travelling alone or with others?').",
      part3_discussion:
        "Ask broader discussion questions related to travel and journeys (e.g., 'How has travel changed in your country?', 'Do you think technology makes travel easier?', 'What are the benefits of travelling abroad?'). Ask 2-3 questions.",
      closing:
        "Thank the student for their participation and say goodbye. Make clear that this session is practice-only and does not generate a saved or numeric result.",
      completed: "The conversation is complete.",
    };
    return instructions[state];
  }

  /**
   * Get a fallback response for each state (used if LLM fails).
   */
  getFallback(state: ExaminerState): string {
    const fallbacks: Record<ExaminerState, string> = {
      introduction:
        "Hello, I'm your AI speaking-practice guide, not an official examiner. Let's have a short English conversation. Share a nickname or a familiar topic if you'd like — please don't share sensitive personal details.",
      part1_questions: "That's interesting. Can you tell me more about that?",
      part2_instructions:
        "Here's an original practice prompt: Describe a memorable journey you have taken. You may take about a minute to prepare and speak for up to two minutes; those are flexible practice suggestions, not an official exam timer. You could say where you went, who you went with, what you did, and why it was memorable.",
      part2_preparation:
        "Take a moment to prepare your thoughts; the app does not enforce a timer. Let me know when you're ready to begin speaking.",
      part2_long_turn: "Thank you. Can you tell me a bit more about that experience?",
      part2_followup:
        "That was very interesting. Would you like to take a similar journey again in the future?",
      part3_discussion: "How do you think travel has changed in your country in recent years?",
      closing:
        "Thank you for practising with me. This session does not generate a saved or numeric result. Goodbye!",
      completed: "The test is complete.",
    };
    return fallbacks[state];
  }

  /**
   * Get the topic for a given state (used in Part 2).
   */
  getTopicForState(state: ExaminerState): string | undefined {
    if (state === "part2_instructions" || state === "part2_preparation" || state === "part2_long_turn") {
      return "Describe a memorable journey you have taken";
    }
    return undefined;
  }

  /**
   * Get all states in order.
   */
  getAllStates(): ExaminerState[] {
    return [
      "introduction",
      "part1_questions",
      "part2_instructions",
      "part2_preparation",
      "part2_long_turn",
      "part2_followup",
      "part3_discussion",
      "closing",
      "completed",
    ];
  }

  /**
   * Get a human-readable label for a state.
   */
  getStateLabel(state: ExaminerState): string {
    const labels: Record<ExaminerState, string> = {
      introduction: "Speaking practice: Introduction",
      part1_questions: "Speaking practice: Conversation",
      part2_instructions: "Speaking practice: Topic prompt",
      part2_preparation: "Speaking practice: Preparation",
      part2_long_turn: "Speaking practice: Longer response",
      part2_followup: "Speaking practice: Follow-up",
      part3_discussion: "Speaking practice: Broader discussion",
      closing: "Speaking practice: Closing",
      completed: "Conversation complete",
    };
    return labels[state];
  }
}
