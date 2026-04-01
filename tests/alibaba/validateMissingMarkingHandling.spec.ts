import { test } from '../../framework/fixtures/alibaba.fixture';
import { MissingMarkingValidationOrchestrator } from "../../framework/orchestrators/missingMarkingValidationOrchestrator";
import { promptData } from "../../data/prompts/promptData";

/**
 * Test Suite: Missing Marking Validation
 * 
 * This test verifies the missing marking scenarios:
 * 1. Base response missing marking → Toast appears with message
 * 2. Frontier response missing marking → Modal appears blocking submission
 * 
 * Features tested:
 * - Toast detection and dismissal for base marking
 * - Modal detection and dismissal for frontier marking
 * - Proper logging of which responses need marking
 * - Response marking detection (both Correct and Incorrect are unchecked)
 */

const selected = promptData.find(p => p.id === "missingMarkingValidation");

test.only(`Missing Marking Validation: Base Response Toast & Frontier Response Modal`, async ({ testContext }) => {

    if (!selected) throw new Error("Prompt 'missingMarkingValidation' not found in promptData");

    const orchestrator = new MissingMarkingValidationOrchestrator(testContext);

    await orchestrator.run(selected);

});
