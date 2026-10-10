/**
 * Text-only speaking-transcript feedback. A transcript cannot evidence
 * pronunciation, acoustic fluency, timing, pauses, intelligibility, or accent,
 * so this module deliberately returns no numeric speaking result.
 *
 * Transcripts stay in the local application and are not sent to an external
 * model by this module. This is generic feedback, not a validated exam rubric.
 */
export type SpeakingEvaluation = {
  transcriptWordCount: number;
  improvementTips: string[];
  providerUsed: 'local_transcript_rules';
  disclaimer: string;
};

const DISCLAIMER =
  'Generic transcript-only suggestions. No speaking score, pronunciation assessment, acoustic fluency measurement, or accent classification is produced.';

export function evaluateSpeaking(transcript: string): SpeakingEvaluation {
  const normalized = transcript.trim().replace(/\s+/g, ' ');
  const transcriptWordCount = normalized ? normalized.split(' ').length : 0;
  const improvementTips = buildTranscriptTips(normalized, transcriptWordCount);

  return {
    transcriptWordCount,
    improvementTips,
    providerUsed: 'local_transcript_rules',
    disclaimer: DISCLAIMER,
  };
}

function buildTranscriptTips(transcript: string, wordCount: number): string[] {
  if (wordCount === 0) {
    return ['No transcript was provided. An audio recording and validated acoustic assessment are required for speaking feedback.'];
  }

  const tips: string[] = [];
  const words = transcript.toLowerCase().split(/[^a-z\-'']+/).filter((word) => word.length > 1);
  const uniqueRatio = words.length > 0 ? new Set(words).size / words.length : 0;
  const repeatedFillers = (transcript.toLowerCase().match(/\b(um|uh|erm|er)\b/g) ?? []).length;

  if (wordCount < 30) {
    tips.push('The transcript is brief; consider adding a supporting detail or example if the prompt asks for an extended response.');
  }
  if (repeatedFillers > 2) {
    tips.push('If these fillers reflect your actual speech, practise pausing silently before continuing. Transcription may omit or misrecognize fillers.');
  }
  if (words.length >= 10 && uniqueRatio < 0.5) {
    tips.push('Review repeated wording and use precise alternatives only when they preserve your meaning.');
  }
  if (tips.length === 0) {
    tips.push('Review the transcript for whether it answers the prompt and supports its main idea. This text review does not assess how the response sounded.');
  }

  return tips.slice(0, 4);
}
