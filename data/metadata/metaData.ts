import { EssayMetadataConfig, MultipleChoiceMetadataConfig } from '../../types/metadata.types';

export const metadata: Record<string, EssayMetadataConfig | MultipleChoiceMetadataConfig> = {

    // Essay preset — only has finalAnswer, no correctAnswer
    chemistryUndergrad: {
        questionType: 'essay',          // ← discriminator
        finalAnswer: 'The answer is provided',
        solutionProcess: 'Step by step process',
        thinkingProcess: 'Logical reasoning applied',
        answerUnit: 'N/A',
        noUnitRequired: false,
        knowledgePoints: ['Physics'],
        level: 'Undergraduate',
        discipline: 'Organic Chemistry'
    } satisfies EssayMetadataConfig,

    // Multiple Choice preset — only has correctAnswer + incorrectAnswers, no finalAnswer
    chemistryUndergradMC: {
        questionType: 'multipleChoice',  // ← discriminator
        correctAnswer: 'H2O',
        incorrectAnswers: ['CO2', 'NaCl', 'O2'],
        solutionProcess: 'Step by step process',
        thinkingProcess: 'Logical reasoning applied',
        answerUnit: '',
        noUnitRequired: true,
        knowledgePoints: ['Chemistry'],
        level: 'Undergraduate',
        discipline: 'Organic Chemistry'
    } satisfies MultipleChoiceMetadataConfig,
};