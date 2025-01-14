import { GoogleGenerativeAI } from "@google/generative-ai";
import { ComputerService } from "./computer.service";
import Fuse from "fuse.js";
import axios from "axios";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const computerService = new ComputerService();

const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Helper function to format image URLs
const formatImageUrl = (url: string | null | undefined): string | null | undefined => {
  if (url && url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
};

// Helper function to format part details with image URLs
const formatPartDetails = (part: any) => {
  if (!part) return null;
  return {
    ...part,
    imageUrl: formatImageUrl(part.imageUrl),
  };
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
  
    try {
        const result = await model.generateContent(promptText);
        const response = await result.response;
        const responseText = await response.text();
  
        let assemblyGuide;
        try {
            assemblyGuide = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Failed to parse AI response as JSON. Attempting to fix...');
  
            const jsonMatch = responseText.match(/\{.*\}/s);
            if (jsonMatch) {
                try {
                    assemblyGuide = JSON.parse(jsonMatch[0]);
                } catch (fallbackError) {
                    console.error('Failed to fix JSON:', fallbackError);
                    throw new Error('AI response is not valid JSON and could not be fixed.');
                }
            } else {
                throw new Error('AI response does not contain valid JSON.');
            }
        }
  
  
        for (const step of assemblyGuide.steps) {
            const stepPrompts = step.imagePrompts;
  
  
            const imageUrls = await Promise.all(
                stepPrompts.map(async (prompt: string) => {
                    try {
                        const searchResponse = await axios.get(
                            `https://www.googleapis.com/customsearch/v1`,
                            {
                                params: {
                                    q: prompt,
                                    cx: GOOGLE_CSE_ID,
                                    key: GOOGLE_API_KEY,
                                    searchType: 'image',
                                    num: 1
                                },
                            }
                        );
  
                        if (searchResponse.data.items) {
                            return searchResponse.data.items
                                .filter((item: any) => item.mime.startsWith('image/'))
                                .map((item: any) => item.link);
                        } else {
                            console.error('No items found in API response for prompt:', prompt);
                            return [];
                        }
                    } catch (error) {
                        console.error(`Error fetching images for prompt: ${prompt}`, error);
                        return [];
                    }
                })
            );
  
            step.images = imageUrls.flat();
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
    } catch (error) {
        if (error instanceof Error) {
            console.error('Error:', error.message);
            return {
                success: false,
                error: error.message,
            };
        } else {
            console.error('Unknown error occurred:', error);
            return {
                success: false,
                error: 'An unknown error occurred.',
            };
        }
    }
  },
  


  async getPC(prompt: string) {
    const availableMotherboards = await computerService.getMotherboards();
    const availableCPUs = await computerService.getCPUs();
    const availableGPUs = await computerService.getGPUs();
    const availableMemory = await computerService.getMemory();
    const availablePowerSupplies = await computerService.getPowerSupplies();
    const availableCases = await computerService.getCases();
    const availableStorage = await computerService.getStorage();
  
    const promptText = `
  Given the following user prompt, return a JSON object with the best PC components that match the user's needs while strictly adhering to the budget and prioritizing high-performance CPU and GPU. IMPORTANT: Only use motherboards from the provided list below. Do not suggest motherboards that are not in this list.
  
  User Prompt: "${prompt}"
  
  Available Motherboards:
  ${availableMotherboards.map(m => m.name).join(", ")}
  
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
  
    try {
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();
  
      console.log('AI Response:', text);
  
      const jsonMatch = text.match(/\{.*\}/s);
      if (!jsonMatch) {
        return { success: false, error: 'No valid JSON found in the AI response.' };
      }
  
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        return { success: false, error: 'Failed to parse AI response as JSON.' };
      }
  
      // Fuzzy matching setup
      const fuseOptions = {
        includeScore: true,
        threshold: 0.5, // Adjust the threshold as needed
        keys: ['name']
      };
  
      const fuseMotherboards = new Fuse(availableMotherboards, fuseOptions);
      const fuseCPUs = new Fuse(availableCPUs, fuseOptions);
      const fuseGPUs = new Fuse(availableGPUs, { ...fuseOptions, keys: ['chipset'] }); // Match GPU based on chipset
      const fuseMemory = new Fuse(availableMemory, fuseOptions);
      const fusePowerSupplies = new Fuse(availablePowerSupplies.map(p => ({
        ...p,
        name: `${p.name} ${p.wattage}W`
      })), fuseOptions);
      const fuseCases = new Fuse(availableCases, fuseOptions);
      const fuseStorage = new Fuse(availableStorage.map(s => ({
        ...s,
        name: `${s.name} ${s.capacity}GB`
      })), fuseOptions);
  
      // Match parts
      const matchedMotherboard = fuseMotherboards.search(jsonResponse.motherboard)[0]?.item;
      const matchedCPU = fuseCPUs.search(jsonResponse.cpu)[0]?.item;
      const matchedGPU = fuseGPUs.search(jsonResponse.gpu)[0]?.item; // Match GPU based on chipset
      const matchedRAM = fuseMemory.search(jsonResponse.ram)[0]?.item;
      const matchedPSU = fusePowerSupplies.search(jsonResponse.psu)[0]?.item;
      const matchedCase = fuseCases.search(jsonResponse.case)[0]?.item;
      const matchedHDD = fuseStorage.search(jsonResponse.hdd)[0]?.item;
      const matchedSSD = fuseStorage.search(jsonResponse.ssd)[0]?.item;
  
      if (!matchedMotherboard) {
        return { success: false, error: 'AI suggested an invalid motherboard.' };
      }
  
      // Fetch detailed part information
      const motherboardDetails = await computerService.getMotherboardById(matchedMotherboard.id);
      const cpuDetails = matchedCPU ? await computerService.getCpuById(matchedCPU.id) : null;
      const gpuDetails = matchedGPU ? await computerService.getGpuById(matchedGPU.id) : null;
      const ramDetails = matchedRAM ? await computerService.getMemoryById(matchedRAM.id) : null;
      const psuDetails = matchedPSU ? await computerService.getPowerSupplyById(matchedPSU.id) : null;
      const caseDetails = matchedCase ? await computerService.getCaseById(matchedCase.id) : null;
      const hddDetails = matchedHDD ? await computerService.getStorageById(matchedHDD.id) : null;
      const ssdDetails = matchedSSD ? await computerService.getStorageById(matchedSSD.id) : null;
  
      // Format all image URLs
      const matchedParts = {
        cpu: formatPartDetails(cpuDetails),
        gpu: formatPartDetails(gpuDetails),
        memory: formatPartDetails(ramDetails),
        powerSupply: formatPartDetails(psuDetails),
        case: formatPartDetails(caseDetails),
        storage: formatPartDetails(hddDetails),
        storage2: formatPartDetails(ssdDetails),
        motherboard: formatPartDetails(motherboardDetails),
      };
  
      return { success: true, response: matchedParts };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      } else {
        return { success: false, error: 'Unknown error occurred' };
      }
    }
  },

  async fuzzyMatchStorage(storageName: string, availableStorage: any[]) {
    const fuseOptions = {
      includeScore: true,
      threshold: 0.5,
      keys: ['name']
    };

    const fuseStorage = new Fuse(availableStorage.map(s => ({
      ...s,
      name: `${s.name} ${s.capacity}GB`
    })), fuseOptions);

    return fuseStorage.search(storageName)[0]?.item;
  },

  async fuzzyMatchPSU(psuName: string, availablePSUs: any[]) {
    const fuseOptions = {
      includeScore: true,
      threshold: 0.5,
      keys: ['name']
    };

    const fusePSUs = new Fuse(availablePSUs.map(p => ({
      ...p,
      name: `${p.name} ${p.wattage}W`
    })), fuseOptions);

    return fusePSUs.search(psuName)[0]?.item;
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

    try {
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();

      console.log('AI Response:', text);

      // Extract JSON from the response
      const jsonMatch = text.match(/\{.*\}/s);
      if (!jsonMatch) {
        return { success: false, error: 'No valid JSON found in the AI response.' };
      }

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        return { success: false, error: 'Failed to parse AI response as JSON.' };
      }

      return { success: true, response: jsonResponse };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      } else {
        return { success: false, error: 'Unknown error occurred.' };
      }
    }
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

    try {
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();

      console.log('AI Response:', text);

      // Extract JSON from the response
      const jsonMatch = text.match(/\{.*\}/s);
      if (!jsonMatch) {
        return { success: false, error: 'No valid JSON found in the AI response.' };
      }

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        return { success: false, error: 'Failed to parse AI response as JSON.' };
      }

      return { success: true, response: jsonResponse };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      } else {
        return { success: false, error: 'Unknown error occurred.' };
      }
    }
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
  
    try {
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();
  
      console.log('AI Response:', text);
  
      // Extract JSON from the response
      const jsonMatch = text.match(/\{.*\}/s);
      if (!jsonMatch) {
        return { success: false, error: 'No valid JSON found in the AI response.' };
      }
  
      let jsonResponse;
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        return { success: false, error: 'Failed to parse AI response as JSON.' };
      }
  
      // Define the maximum number of suggested parts
      const maxSuggestedParts = 4;
  
      // Fetch all available parts for fuzzy matching
      const availableMotherboards = await computerService.getMotherboards();
      const availableCPUs = await computerService.getCPUs();
      const availableGPUs = await computerService.getGPUs();
      const availableMemory = await computerService.getMemory();
      const availablePowerSupplies = await computerService.getPowerSupplies();
      const availableCases = await computerService.getCases();
      const availableStorage = await computerService.getStorage();
  
      // Fuzzy matching setup
      const fuseOptions = {
        includeScore: true,
        threshold: 0.5,
        keys: ['name']
      };
  
      const fuseMotherboards = new Fuse(availableMotherboards, fuseOptions);
      const fuseCPUs = new Fuse(availableCPUs, fuseOptions);
      const fuseGPUs = new Fuse(availableGPUs, fuseOptions);
      const fuseMemory = new Fuse(availableMemory, fuseOptions);
      const fusePowerSupplies = new Fuse(availablePowerSupplies.map(p => ({
        ...p,
        name: `${p.name} ${p.wattage}W`
      })), fuseOptions);
      const fuseCases = new Fuse(availableCases, fuseOptions);
      const fuseStorage = new Fuse(availableStorage.map(s => ({
        ...s,
        name: `${s.name} ${s.capacity}GB`
      })), fuseOptions);
  
      // Function to perform fuzzy matching and fetch detailed part information
      const getMatchedPartDetails = async (partName: string, partType: string) => {
        let fuse;
        let matchedPartDetails = null;
  
        // Choose the appropriate Fuse instance based on part type
        switch (partType.toLowerCase()) {
          case 'cpu':
            fuse = fuseCPUs;
            break;
          case 'gpu':
            fuse = fuseGPUs;
            break;
          case 'ram':
            fuse = fuseMemory;
            break;
          case 'psu':
            fuse = fusePowerSupplies;
            break;
          case 'case':
            fuse = fuseCases;
            break;
          case 'motherboard':
            fuse = fuseMotherboards;
            break;
          case 'ssd':
          case 'hdd':
            fuse = fuseStorage;
            break;
          default:
            return null;
        }
  
        const matchedPart = fuse.search(partName)[0]?.item;
        if (matchedPart) {
          // Fetch details for the matched part
          if (fuse === fuseMotherboards) {
            matchedPartDetails = await computerService.getMotherboardById(matchedPart.id);
          } else if (fuse === fuseCPUs) {
            matchedPartDetails = await computerService.getCpuById(matchedPart.id);
          } else if (fuse === fuseGPUs) {
            matchedPartDetails = await computerService.getGpuById(matchedPart.id);
          } else if (fuse === fuseMemory) {
            matchedPartDetails = await computerService.getMemoryById(matchedPart.id);
          } else if (fuse === fusePowerSupplies) {
            matchedPartDetails = await computerService.getPowerSupplyById(matchedPart.id);
          } else if (fuse === fuseCases) {
            matchedPartDetails = await computerService.getCaseById(matchedPart.id);
          } else if (fuse === fuseStorage) {
            matchedPartDetails = await computerService.getStorageById(matchedPart.id);
          }
        }
  
        return matchedPartDetails ? formatPartDetails(matchedPartDetails) : null;
      };
  
      const compatibilityIssuesWithDetails = await Promise.all(
        jsonResponse.compatibilityIssues.map(async (issue: any) => {
          const suggestedPartsWithDetails = await Promise.all(
            issue.suggestedParts.slice(0, maxSuggestedParts).map(async (suggestedPart: any) => {
              const { name, type } = suggestedPart;
              const matchedPartDetails = await getMatchedPartDetails(name, type);
  
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
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      } else {
        return { success: false, error: 'Unknown error occurred.' };
      }
    }
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

    try {
      const result = await model.generateContent(promptText);
      const response = await result.response;
      const text = response.text();

      console.log('AI Response:', text);

      // Extract JSON from the response
      const jsonMatch = text.match(/\{.*\}/s);
      if (!jsonMatch) {
        return { success: false, error: 'No valid JSON found in the AI response.' };
      }

      let jsonResponse;
      try {
        jsonResponse = JSON.parse(jsonMatch[0]);
      } catch (error) {
        return { success: false, error: 'Failed to parse AI response as JSON.' };
      }

      return { success: true, response: jsonResponse };
    } catch (error: unknown) {
      if (error instanceof Error) {
        return { success: false, error: error.message };
      } else {
        return { success: false, error: 'Unknown error occurred.' };
      }
    }
  },
}