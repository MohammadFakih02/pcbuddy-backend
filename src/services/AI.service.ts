import { GoogleGenerativeAI } from "@google/generative-ai";
import { ComputerService } from "./computer.service";
import { formatImageUrl, formatPartDetails, fuzzyMatch, fetchImages } from "../utils/aiutils";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const computerService = new ComputerService();

// Helper function to handle AI response and JSON parsing
const handleAIResponse = async (promptText: string) => {
  try {
    const result = await model.generateContent(promptText);
    const response = await result.response;
    const text = response.text();

    const jsonMatch = text.match(/\{.*\}/s);
    if (!jsonMatch) {
      return { success: false, error: 'No valid JSON found in the AI response.' };
    }

    try {
      return { success: true, response: JSON.parse(jsonMatch[0]) };
    } catch (error) {
      return { success: false, error: 'Failed to parse AI response as JSON.' };
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return { success: false, error: error.message };
    } else {
      return { success: false, error: 'Unknown error occurred.' };
    }
  }
};

// Helper function to get matched part details
const getMatchedPartDetails = async (partName: string, partType: string, availableParts: any[]) => {
  const matchedPart = fuzzyMatch(availableParts, partName, { includeScore: true, threshold: 0.5, keys: ['name'] });
  if (!matchedPart) return null;

  let partDetails;
  switch (partType.toLowerCase()) {
    case 'cpu':
      partDetails = await computerService.getCpuById(matchedPart.id);
      break;
    case 'gpu':
      partDetails = await computerService.getGpuById(matchedPart.id);
      break;
    case 'ram':
      partDetails = await computerService.getMemoryById(matchedPart.id);
      break;
    case 'psu':
      partDetails = await computerService.getPowerSupplyById(matchedPart.id);
      break;
    case 'case':
      partDetails = await computerService.getCaseById(matchedPart.id);
      break;
    case 'motherboard':
      partDetails = await computerService.getMotherboardById(matchedPart.id);
      break;
    case 'ssd':
    case 'hdd':
      partDetails = await computerService.getStorageById(matchedPart.id);
      break;
    default:
      return null;
  }

  return formatPartDetails(partDetails);
};

export const AIService = {
  async getAssemblyGuideAndImages(pcParts: { cpu: string; gpu: string; ram: string; motherboard: string; psu: string; case: string }) {
    const { cpu, gpu, ram, motherboard, psu, case: pcCase } = pcParts;

    const promptText = `
    Provide a detailed and step-by-step guide for assembling a PC with the following components:
    - CPU: ${cpu}
    - GPU: ${gpu}
    - RAM: ${ram}
    - Motherboard: ${motherboard}
    - PSU: ${psu}
    - Case: ${pcCase}

    Include:
    1. Step-by-step instructions with explicit details for each component's installation.
    2. A list of necessary tools for assembly.
    3. Cable management tips.
    4. Common pitfalls and precautions to avoid damage.
    5. Detailed explanations of terms and processes for beginners.

    Format the response as a JSON object with the following structure:
    {
      "tools": ["list", "of", "tools"],
      "steps": [
        {
          "title": "Step 1: Install the CPU",
          "description": [
            "1. Open the CPU socket lever on the motherboard.",
            "2. Carefully align the CPU's gold triangles with the corresponding markings on the socket.",
            "3. Gently lower the CPU into the socket.",
            "4. Close the lever securely.",
            "5. Do not force the CPU in; if it doesn't fit easily, double-check the alignment."
          ],
          "images": [],
          "imagePrompts": []
        },
        {
          "title": "Step 2: Install the CPU Cooler",
          "description": [
            "1. Apply a small pea-sized amount of thermal paste to the center of the CPU.",
            "2. Carefully align the cooler with the CPU and gently lower it into place.",
            "3. Secure the cooler using the provided mounting hardware."
          ],
          "images": [],
          "imagePrompts": []
        }
      ],
      "cableManagementTips": "Tips for managing cables...",
      "commonPitfalls": "Common mistakes to avoid..."
    }

    For each step, generate 2-3 search prompts that are specific to the topic but focus on the **action** being performed. The prompts should:
    - Describe the action (e.g., "installing a CPU," "connecting power cables").
    - Include contextual details about the step (e.g., "inside a PC case," "on a motherboard").
    - Use descriptive terms like "close-up," "step-by-step," or "diagram" to ensure the images are clear and relevant.
    - Avoid using overly specific component names (e.g., "Intel Core i7 CPU") unless absolutely necessary.

    Example prompts:
    - "Close-up of installing a CPU on a motherboard inside a PC case"
    - "Step-by-step diagram of installing RAM on a motherboard"
    - "Connecting power cables to a motherboard inside a PC case"

    Add these prompts to the "imagePrompts" field for each step.
    Ensure the response is valid JSON and does not contain any additional text or formatting outside the JSON object.
    `;

    const result = await handleAIResponse(promptText);
    if (!result.success) return result;

    const assemblyGuide = result.response;

    for (const step of assemblyGuide.steps) {
      step.images = await fetchImages(step.imagePrompts);
    }

    return {
      success: true,
      data: {
        tools: assemblyGuide.tools,
        steps: assemblyGuide.steps,
        cableManagementTips: assemblyGuide.cableManagementTips,
        commonPitfalls: assemblyGuide.commonPitfalls
      }
    };
  },

  async getPC(prompt: string) {
    const availableParts = {
      motherboards: await computerService.getMotherboards(),
      cpus: await computerService.getCPUs(),
      gpus: await computerService.getGPUs(),
      memory: await computerService.getMemory(),
      powerSupplies: await computerService.getPowerSupplies(),
      cases: await computerService.getCases(),
      storage: await computerService.getStorage(),
    };

    const promptText = `
    Given the following user prompt, return a JSON object with the best PC components that match the user's needs while strictly adhering to the budget and prioritizing high-performance CPU and GPU. IMPORTANT: Only use motherboards from the provided list below. Do not suggest motherboards that are not in this list.

    User Prompt: "${prompt}"

    Available Motherboards:
    ${availableParts.motherboards.map(m => m.name).join(", ")}

    The AI should:
    1. Stay strictly within the budget range provided by the user.
    2. Prioritize allocating the majority of the budget to the CPU and GPU to ensure high performance.
    3. Suggest components that are stronger or more capable than what the user requested, if possible within the budget.
    4. Suggest a PC build with the following components:
       - CPU name (prioritize high-performance models)
       - GPU name (prioritize high-performance models)
       - RAM name (do not include modules or speed)
       - PSU name (do not include efficiency)
       - Case name
       - HDD name (include capacity in GB)
       - SSD name (include capacity in GB)
       - Motherboard name (must be from the Available Motherboards list)

    Return the response in the following format:
    {
      "cpu": "name of the CPU",
      "gpu": "name of the GPU",
      "ram": "name of the RAM",
      "psu": "name of the PSU",
      "case": "name of the case",
      "hdd": "name of the HDD with capacity in GB",
      "ssd": "name of the SSD with capacity in GB",
      "motherboard": "name of the motherboard"
    }

    Ensure the response is a valid JSON object and does not contain any additional text or explanations.
    `;

    const result = await handleAIResponse(promptText);
    if (!result.success) return result;

    const jsonResponse = result.response;

    const matchedParts = {
      cpu: await getMatchedPartDetails(jsonResponse.cpu, 'cpu', availableParts.cpus),
      gpu: await getMatchedPartDetails(jsonResponse.gpu, 'gpu', availableParts.gpus),
      memory: await getMatchedPartDetails(jsonResponse.ram, 'ram', availableParts.memory),
      powerSupply: await getMatchedPartDetails(jsonResponse.psu, 'psu', availableParts.powerSupplies),
      case: await getMatchedPartDetails(jsonResponse.case, 'case', availableParts.cases),
      storage: await getMatchedPartDetails(jsonResponse.hdd, 'hdd', availableParts.storage),
      storage2: await getMatchedPartDetails(jsonResponse.ssd, 'ssd', availableParts.storage),
      motherboard: await getMatchedPartDetails(jsonResponse.motherboard, 'motherboard', availableParts.motherboards),
    };

    return { success: true, response: matchedParts };
  },

  async getPerformance(pcParts: { cpu: string; gpu: string; ram: string }, gameName: string) {
    const { cpu, gpu, ram } = pcParts;

    const promptText = `
    Based on the following PC components and game, estimate the average FPS for each graphical preset (low, medium, high, ultra).

    PC Components:
    - CPU: ${cpu}
    - GPU: ${gpu}
    - RAM: ${ram}

    Game: ${gameName}

    The AI should return a JSON object in the following format:
    {
      "low": FPS for low preset,
      "medium": FPS for medium preset,
      "high": FPS for high preset,
      "ultra": FPS for ultra preset
    }

    Ensure the response is valid JSON without any additional explanations or text.

    Consider the following guidelines for FPS estimation:
    1. Base FPS on the GPU's performance tier (entry-level, mid-range, high-end, enthusiast).
    2. Adjust FPS based on the CPU's performance tier (low, mid, high).
    3. Assume the game is running at 1080p resolution.
    4. Factor in the game's optimization (well-optimized, average, poorly optimized).
    5. Provide higher FPS numbers for lower presets and slightly lower FPS for ultra presets.
    `;

    return handleAIResponse(promptText);
  },

  async getTemplateGraph(pcParts: { cpu: string; gpu: string; ram: string }) {
    const { cpu, gpu, ram } = pcParts;

    const games = [
      "Cyberpunk 2077",
      "Red Dead Redemption 2",
      "Counter Strike 2",
      "Fortnite",
      "Call of Duty: Warzone"
    ];

    const promptText = `
    Based on the following PC components, estimate the **highest possible average FPS** for each graphical preset (low, medium, high, ultra) for the following games. Prioritize higher FPS numbers while maintaining realistic expectations based on the hardware.

    PC Components:
    - CPU: ${cpu}
    - GPU: ${gpu}
    - RAM: ${ram}

    Games:
    ${games.join(", ")}

    The AI should return a JSON object in the following format:
    {
      "Cyberpunk 2077": {
        "low": FPS for low preset,
        "medium": FPS for medium preset,
        "high": FPS for high preset,
        "ultra": FPS for ultra preset
      },
      "Red Dead Redemption 2": {
        "low": FPS for low preset,
        "medium": FPS for medium preset,
        "high": FPS for high preset,
        "ultra": FPS for ultra preset
      },
      "Counter Strike 2": {
        "low": FPS for low preset,
        "medium": FPS for medium preset,
        "high": FPS for high preset,
        "ultra": FPS for ultra preset
      },
      "Fortnite": {
        "low": FPS for low preset,
        "medium": FPS for medium preset,
        "high": FPS for high preset,
        "ultra": FPS for ultra preset
      },
      "Call of Duty: Warzone": {
        "low": FPS for low preset,
        "medium": FPS for medium preset,
        "high": FPS for high preset,
        "ultra": FPS for ultra preset
      }
    }

    Ensure the response is valid JSON without any additional explanations or text.

    **Consider the following guidelines for FPS estimation:**
    1. Base FPS on the GPU's performance tier (entry-level, mid-range, high-end, enthusiast), assuming the GPU is capable of delivering high FPS.
    2. Adjust FPS based on the CPU's performance tier (low, mid, high), assuming the CPU does not bottleneck the GPU.
    3. Assume the game is running at 1080p resolution.
    4. Factor in the game's optimization (well-optimized, average, poorly optimized), but prioritize higher FPS even for poorly optimized games.
    5. Provide significantly higher FPS numbers for lower presets and slightly lower but still high FPS for ultra presets.
    `;

    return handleAIResponse(promptText);
  },

  async checkCompatibility(fullSystem: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
    ssd: string;
    hdd: string;
    motherboard: string;
    psu: string;
    case: string;
  }) {
    const { cpu, gpu, ram, storage, ssd, hdd, motherboard, psu, case: pcCase } = fullSystem;
    const availableMotherboards = await computerService.getMotherboards();
  
    const promptText = `
    Given the following PC components, check for any compatibility issues and suggest parts to fix the issues.
    Available Motherboards:
    ${availableMotherboards.map(m => m.name).join(", ")}
  
    PC Components:
    - CPU: ${cpu}
    - GPU: ${gpu}
    - RAM: ${ram}
    - Storage: ${storage}
    - SSD: ${ssd}
    - HDD: ${hdd}
    - Motherboard: ${motherboard}
    - PSU: ${psu}
    - Case: ${pcCase}
  
    The AI should:
    - Check for compatibility issues between the components.
    - Identify the parts causing the issues.
    - Suggest alternative parts to fix the issues.
  
    For each suggested part, include both the part name and type in the following format:
    {
      "name": "Suggested part name",
      "type": "Part type (e.g., CPU, Motherboard, GPU, etc.)"
    }
  
    Return the response in the following JSON format:
    {
      "compatibilityIssues": [
        {
          "issue": "Description of the compatibility issue",
          "causingParts": ["Part causing the issue"],
          "suggestedParts": [
            { "name": "Suggested part name", "type": "Part type" }
          ]
        }
      ]
    }
  
    Ensure the response is valid JSON without any additional explanations or text.
    `;
  
    const result = await handleAIResponse(promptText);
    if (!result.success) return result;
  
    const jsonResponse = result.response;
  
    const availableParts = {
      motherboards: await computerService.getMotherboards(),
      cpus: await computerService.getCPUs(),
      gpus: await computerService.getGPUs(),
      memory: await computerService.getMemory(),
      powerSupplies: await computerService.getPowerSupplies(),
      cases: await computerService.getCases(),
      storage: await computerService.getStorage(),
    };
  
    // Mapping object to map part types to their corresponding keys in availableParts
    const partTypeToKeyMap: Record<string, keyof typeof availableParts> = {
      cpu: 'cpus',
      gpu: 'gpus',
      ram: 'memory',
      psu: 'powerSupplies',
      case: 'cases',
      motherboard: 'motherboards',
      ssd: 'storage',
      hdd: 'storage',
    };
  
    const compatibilityIssuesWithDetails = await Promise.all(
      jsonResponse.compatibilityIssues.map(async (issue: any) => {
        const suggestedPartsWithDetails = await Promise.all(
          issue.suggestedParts.slice(0, 4).map(async (suggestedPart: any) => {
            const { name, type } = suggestedPart;
            const partKey = partTypeToKeyMap[type.toLowerCase()];
            const matchedPartDetails = await getMatchedPartDetails(name, type, availableParts[partKey]);
            return matchedPartDetails ? { ...matchedPartDetails, type } : null;
          })
        );
  
        return {
          ...issue,
          suggestedParts: suggestedPartsWithDetails.filter((part) => part !== null),
        };
      })
    );
  
    return { success: true, response: { compatibilityIssues: compatibilityIssuesWithDetails } };
  },

  async ratePC(fullSystem: {
    cpu: string;
    gpu: string;
    ram: string;
    storage: string;
    ssd: string;
    hdd: string;
    motherboard: string;
    psu: string;
    case: string;
  }) {
    const { cpu, gpu, ram, storage, ssd, hdd, motherboard, psu, case: pcCase } = fullSystem;

    const promptText = `
    Given the following PC components, rate the CPU, GPU, and overall system on a scale of 1 to 10.
    The rating should be based on performance, compatibility, and value for money.

    PC Components:
    - CPU: ${cpu}
    - GPU: ${gpu}
    - RAM: ${ram}
    - Storage: ${storage}
    - SSD: ${ssd}
    - HDD: ${hdd}
    - Motherboard: ${motherboard}
    - PSU: ${psu}
    - Case: ${pcCase}

    The AI should return a JSON object in the following format:
    {
      "cpu": CPU rating (out of 10),
      "gpu": GPU rating (out of 10),
      "overall": Overall system rating (out of 10)
    }

    Ensure the response is valid JSON without any additional explanations or text.
    `;

    return handleAIResponse(promptText);
  },
};