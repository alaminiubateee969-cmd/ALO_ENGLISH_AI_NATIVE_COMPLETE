/**
 * src/lib/ai/examiner/ExaminerStateMachine.ts
 *
 * Robust IELTS Speaking Test state machine.
 *
 * The test has 3 parts:
 *   Part 1 — Introduction & Interview (4-5 min): examiner asks general questions
 *            about familiar topics (home, family, work, studies, hobbies)
 *   Part 2 — Long Turn (3-4 min): cue card topic, 1 min prep, 2 min speech,
 *            1 follow-up question
 *   Part 3 — Discussion (4-5 min): abstract discussion questions linked to Part 2
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
        "Introduce yourself as the AI examiner (use your persona name). Ask the student to introduce themselves — name, where they're from, and what they do (work or study).",
      part1_questions:
        "Ask 2-3 general questions about familiar topics based on their introduction (hometown, hobbies, daily routine, studies/work). Listen to their answers and ask natural follow-ups.",
      part2_instructions:
        "Explain Part 2: Give the student a cue card topic. Say they have 1 minute to prepare and should speak for up to 2 minutes. Topic: Describe a memorable journey you have taken. You should say: where you went, who you went with, what you did there, and explain why it was memorable.",
      part2_preparation:
        "Tell the student to take 1 minute to prepare. Ask if they're ready to start speaking.",
      part2_long_turn:
        "Listen to their long turn speech. If they stop early, gently encourage them to continue or elaborate. If they've spoken enough, ask one brief follow-up about the same topic.",
      part2_followup:
        "Ask one follow-up question related to their Part 2 topic (e.g., 'Would you like to go there again?' or 'Do you prefer travelling alone or with others?').",
      part3_discussion:
        "Ask abstract discussion questions related to travel and journeys (e.g., 'How has travel changed in your country?', 'Do you think technology makes travel easier?', 'What are the benefits of travelling abroad?'). Ask 2-3 questions.",
      closing:
        "Thank the student for their participation. Tell them the speaking test is complete and their results will be available shortly. Say goodbye.",
      completed: "The test is complete.",
    };
    return instructions[state];
  }

  /**
   * Get a fallback response for each state (used if LLM fails).
   */
  getFallback(state: ExaminerState): string {
    const fallbacks: Record<ExaminerState, string> = {
      introduction:
        "Hello, I'm your AI speaking examiner. Welcome to the speaking test. Could you introduce yourself — tell me your name, where you're from, and what you do?",
      part1_questions: "That's interesting. Can you tell me more about that?",
      part2_instructions:
        "Now let's move to Part 2. I'll give you a topic. You have 1 minute to prepare, then speak for up to 2 minutes. Your topic is: Describe a memorable journey you have taken. Say where you went, who you went with, what you did, and why it was memorable.",
      part2_preparation:
        "Take a minute to prepare your thoughts. Let me know when you're ready to begin speaking.",
      part2_long_turn: "Thank you. Can you tell me a bit more about that experience?",
      part2_followup:
        "That was very interesting. Would you like to take a similar journey again in the future?",
      part3_discussion: "How do you think travel has changed in your country in recent years?",
      closing:
        "Thank you very much for your participation today. That concludes the speaking test. Your results will be available shortly. Goodbye!",
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
   * Get the total estimated duration for the test in minutes.
   */
  getEstimatedDuration(): number {
    return 11; // Part 1: 4-5, Part 2: 3-4, Part 3: 4-5
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
      introduction: "Introduction",
      part1_questions: "Part 1: Interview",
      part2_instructions: "Part 2: Cue Card",
      part2_preparation: "Part 2: Preparation",
      part2_long_turn: "Part 2: Long Turn",
      part2_followup: "Part 2: Follow-up",
      part3_discussion: "Part 3: Discussion",
      closing: "Closing",
      completed: "Completed",
    };
    return labels[state];
  }
}
