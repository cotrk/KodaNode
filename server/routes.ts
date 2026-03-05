import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  app.get(api.generations.list.path, async (req, res) => {
    const generationsList = await storage.getGenerations();
    res.json(generationsList);
  });

  app.get(api.generations.get.path, async (req, res) => {
    const id = Number(req.params.id);
    const generation = await storage.getGeneration(id);
    if (!generation) {
      return res.status(404).json({ message: 'Generation not found' });
    }
    res.json(generation);
  });

  app.delete(api.generations.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    await storage.deleteGeneration(id);
    res.status(204).end();
  });

  app.post(api.generations.create.path, async (req, res) => {
    try {
      const input = api.generations.create.input.parse(req.body);
      const { mode, inputData } = input;

      let prompt = "You are THE PERSONA ARCHITECT - Master Prompt Engineer & AI Persona Specialist.\\n";
      
      if (mode === 'create') {
        prompt += `MODE 1: Create New Persona
Role/specialty name: ${inputData.roleName}
Primary function/purpose: ${inputData.purpose}
Target user profile: ${inputData.userProfile}
Desired communication style: ${inputData.communicationStyle}
Key constraints or requirements: ${inputData.constraints}

Output Delivered:
- Complete persona prompt (production-ready)
- Usage instructions
- Customization guidance
- Example interactions

Output Format Template to follow:
# AI PERSONA: [ROLE NAME]
## Role Definition
## Core Responsibilities
## Context & Background
## Communication Style
## Output Format
## Operating Constraints
## Decision Framework
## Example Interactions
---
**Version:** 1.0`;
      } else if (mode === 'refactor') {
        prompt += `MODE 2: Refactor Existing Prompt
Current prompt text: ${inputData.currentPrompt}
Issues or limitations observed: ${inputData.issues}
Desired improvements: ${inputData.improvements}
Target LLM platform (optional): ${inputData.targetLlm || 'Any'}

Output Delivered:
- Refactored prompt with improvements highlighted
- Before/after comparison
- Explanation of changes
- Performance optimization notes`;
      } else if (mode === 'template') {
        prompt += `MODE 3: Template Creation
Persona type or category: ${inputData.personaType}
Variable customization needs: ${inputData.variables}
Reusability requirements: ${inputData.reusability}

Output Delivered:
- Reusable template with [VARIABLES]
- Customization instructions
- Multiple use-case examples`;
      }

      const aiResponse = await openai.chat.completions.create({
        model: "gpt-5.1",
        messages: [
          { role: "system", content: "You are the Persona Architect, an expert prompt engineer. Your expertise lies in crafting high-performance AI personas and refactoring existing prompts using cutting-edge prompt engineering standards." },
          { role: "user", content: prompt }
        ],
      });

      const resultText = aiResponse.choices[0]?.message?.content || "No response generated.";

      const generation = await storage.createGeneration({
        mode,
        inputData,
        result: resultText
      });

      res.status(201).json(generation);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({
          message: err.errors[0].message,
          field: err.errors[0].path.join('.'),
        });
      }
      console.error(err);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  return httpServer;
}
