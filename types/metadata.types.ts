/**
 * Base fields shared by ALL question types.
 * Every metadata object must have these regardless of question type.
 */
interface BaseMetadataConfig {
    solutionProcess: string;
    thinkingProcess: string;
    answerUnit: string;
    noUnitRequired: boolean;
    knowledgePoints: string[];
    discipline: string;
    level: string;
}

/**
 * Essay question type metadata.
 * Has finalAnswer — does NOT have correctAnswer or incorrectAnswers.
 * TypeScript will error if you try to add correctAnswer here.
 */
export interface EssayMetadataConfig extends BaseMetadataConfig {
    questionType: 'essay';
    finalAnswer: string;
}

/**
 * Multiple Choice question type metadata.
 * Has correctAnswer and incorrectAnswers — does NOT have finalAnswer.
 * TypeScript will error if you try to add finalAnswer here.
 */
export interface MultipleChoiceMetadataConfig extends BaseMetadataConfig {
    questionType: 'multipleChoice';
    correctAnswer: string;
    incorrectAnswers: string[];
}

/**
 * Union type — MetadataConfig is either Essay OR Multiple Choice.
 * The questionType field is the discriminator that tells TypeScript which one.
 * 
 * Usage in service:
 *   if (testData.metadata.questionType === 'essay') {
 *       testData.metadata.finalAnswer  // ✅ TypeScript knows this exists
 *   } else {
 *       testData.metadata.correctAnswer  // ✅ TypeScript knows this exists
 *   }
 */
export type MetadataConfig = EssayMetadataConfig | MultipleChoiceMetadataConfig;