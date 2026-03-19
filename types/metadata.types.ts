export interface MetadataConfig {
    questionType: string;
    finalAnswer: string;
    correctAnswer: string;
    incorrectAnswers : string [];
    solutionProcess: string;
    thinkingProcess: string;
    answerUnit: string;
    noUnitRequired: boolean;
    knowledgePoints: string[];
    discipline: string;
    level: string;
}