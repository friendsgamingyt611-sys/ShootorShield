
import { GoogleGenAI, Type } from "@google/genai";
import { ActionType, AIResponse, PlayerStats } from "../types";
import { GEMINI_API_KEY } from "./firebaseConfig";

// Initialize Gemini safely
// If the key is left as "YOUR_GEMINI_API_KEY", the game will use offline heuristic AI
const apiKey = GEMINI_API_KEY !== "YOUR_GEMINI_API_KEY" ? GEMINI_API_KEY : ""; 

let ai: GoogleGenAI | null = null;

if (apiKey) {
    try {
        ai = new GoogleGenAI({ apiKey });
    } catch (e) {
        console.warn("Gemini AI failed to initialize", e);
    }
}

export const getAIMove = async (
  player: PlayerStats, 
  opponent: PlayerStats, 
  history: string[]
): Promise<AIResponse> => {
  // Fallback checks for resource availability
  const availableMoves = [ActionType.IDLE];
  if (opponent.ammo > 0) availableMoves.push(ActionType.SHOOT);
  if (opponent.shieldCharges > 0) availableMoves.push(ActionType.SHIELD);

  // Advanced Heuristic Logic (Offline Mode)
  // This ensures the game is playable even without an API Key
  const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  let randomIntensity = 1;
  
  // Logic: If player is low health, try to finish them
  if (player.health < 30 && opponent.ammo > 0) {
      return {
          action: ActionType.SHOOT,
          intensity: Math.min(opponent.ammo, 3),
          thoughtProcess: "Target critical. Executing finishing protocol.",
          taunt: "Goodbye."
      };
  }

  // Logic: If I have high ammo, burst fire
  if (randomMove === ActionType.SHOOT && opponent.ammo >= 2) {
      randomIntensity = Math.random() > 0.7 ? Math.min(3, opponent.ammo) : 1; 
  }
  
  // Return random AI if no key or error
  if (!ai) {
    return {
      action: randomMove,
      intensity: randomIntensity,
      thoughtProcess: "Offline Protocol: Pattern Analysis Active.",
      taunt: "..."
    };
  }

  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      You are playing a high-stakes strategy game called "Shoot or Shield".
      
      Rules:
      1. SHOOT beats IDLE (Deals Damage). Requires AMMO.
      2. SHIELD beats SHOOT (Blocks Damage). Requires SHIELD CHARGE.
      3. IDLE restores nothing but waits for opportunity.
      4. BURST FIRE: You can shoot multiple bullets (intensity) at once. 
      5. Base Gun Damage is 25 per bullet.
      
      Status:
      AI (You): HP ${opponent.health}, Ammo ${opponent.ammo}, Shield ${opponent.shieldCharges}.
      Player (Enemy): HP ${player.health}, Ammo ${player.ammo}, Shield ${player.shieldCharges}.
      History: ${history.join(', ')}.
      
      Decide your next move (SHOOT, SHIELD, IDLE) and intensity.
    `;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ["SHOOT", "SHIELD", "IDLE"] },
            intensity: { type: Type.NUMBER },
            thoughtProcess: { type: Type.STRING },
            taunt: { type: Type.STRING }
          },
          required: ["action", "thoughtProcess", "taunt"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response");
    
    const result = JSON.parse(jsonText) as AIResponse;
    
    // Validate logic locally
    if (result.action === ActionType.SHOOT && opponent.ammo <= 0) result.action = ActionType.IDLE;
    if (result.action === ActionType.SHIELD && opponent.shieldCharges <= 0) result.action = ActionType.IDLE;

    return result;

  } catch (error) {
    return {
      action: randomMove,
      intensity: randomIntensity,
      thoughtProcess: "Fallback Protocol Engaged.",
      taunt: "..."
    };
  }
};
