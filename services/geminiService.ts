
import { GoogleGenAI, Type } from "@google/genai";
import { ActionType, AIResponse, PlayerStats } from "../types";

// Initialize Gemini
const apiKey = process.env.API_KEY || ''; 
const ai = new GoogleGenAI({ apiKey });

export const getAIMove = async (
  player: PlayerStats, 
  opponent: PlayerStats, 
  history: string[]
): Promise<AIResponse> => {
  // Fallback checks for resource availability
  const availableMoves = [ActionType.IDLE];
  if (opponent.ammo > 0) availableMoves.push(ActionType.SHOOT);
  if (opponent.shieldCharges > 0) availableMoves.push(ActionType.SHIELD);

  const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
  // Default burst logic for fallback
  let randomIntensity = 1;
  if (randomMove === ActionType.SHOOT && opponent.ammo >= 2) {
      randomIntensity = Math.random() > 0.7 ? Math.min(3, opponent.ammo) : 1; 
  }
  
  if (!apiKey) {
    console.warn("No API Key found. Using random AI.");
    return {
      action: randomMove,
      intensity: randomIntensity,
      thoughtProcess: "The simulation runs on basic heuristics.",
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
         - Risk: If enemy SHIELDS, all ammo is wasted.
         - Reward: Massive damage if they IDLE or SHOOT.
      5. Base Gun Damage is 25 per bullet.
      
      Current Resources:
      You (AI): HP ${opponent.health}, Armor ${opponent.armor}, Ammo ${opponent.ammo}/${opponent.maxAmmo}, Shield Charges ${opponent.shieldCharges}/${opponent.maxShieldCharges}.
      Character Ability: ${opponent.character.passiveAbility.name} (${opponent.character.passiveAbility.description}).
      
      Enemy (Player): HP ${player.health}, Armor ${player.armor}, Ammo ${player.ammo}/${player.maxAmmo}, Shield Charges ${player.shieldCharges}/${player.maxShieldCharges}.
      Character Ability: ${player.character.passiveAbility.name} (${player.character.passiveAbility.description}).
      
      Recent History: ${history.length > 0 ? history.join(', ') : 'None'}.
      
      Decide your next move.
      - Action: SHOOT, SHIELD, or IDLE.
      - Intensity: If SHOOTing, how many bullets? (1 to ${opponent.ammo}). Defaults to 1.
      
      Provide a strategic reasoning and a short, cyber-punk style taunt.
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
            intensity: { type: Type.NUMBER, description: "Number of bullets to fire if Shooting." },
            thoughtProcess: { type: Type.STRING },
            taunt: { type: Type.STRING }
          },
          required: ["action", "thoughtProcess", "taunt"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) throw new Error("Empty response from AI");
    
    const result = JSON.parse(jsonText) as AIResponse;
    
    // Validate AI move against resources
    if (result.action === ActionType.SHOOT) {
        if (opponent.ammo <= 0) {
            result.action = ActionType.IDLE;
            result.thoughtProcess += " (Forced IDLE: Out of Ammo)";
        } else {
            // Clamp intensity
            result.intensity = Math.max(1, Math.min(result.intensity || 1, opponent.ammo));
        }
    }
    if (result.action === ActionType.SHIELD && opponent.shieldCharges <= 0) {
      result.action = ActionType.IDLE;
      result.thoughtProcess += " (Forced IDLE: Shield Depleted)";
    }

    return result;

  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      action: randomMove,
      intensity: randomIntensity,
      thoughtProcess: "System error. Rebooting logic cores.",
      taunt: "You got lucky, glitch."
    };
  }
};
