import "dotenv/config";
import { vi } from "vitest";

// Mock LLM to avoid real API calls and needing an API key
vi.mock("./server/_core/llm", () => ({
    invokeLLM: vi.fn().mockResolvedValue({
        id: "mock-id",
        created: Date.now(),
        model: "gemini-2.5-flash",
        choices: [
            {
                index: 0,
                message: {
                    role: "assistant",
                    content: "This is a mock response from the AI assistant for testing purposes.",
                },
                finish_reason: "stop",
            },
        ],
    }),
}));

// Mock gatherUserContext if needed, or other expensive/external logic
