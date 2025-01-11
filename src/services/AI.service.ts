import { GoogleGenerativeAI } from "@google/generative-ai";
import { ComputerService } from "./computer.service";
import Fuse from "fuse.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const computerService = new ComputerService();

const formatImageUrl = (url: string | null | undefined): string | null | undefined => {
  if (url && url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
};

export const AIService = {
  async getPC(prompt: string) {
    const availableMotherboards = await computerService.getMotherboards();
    const availableCPUs = await computerService.getCPUs();
    const availableGPUs = await computerService.getGPUs();
    const availableMemory = await computerService.getMemory();
    const availablePowerSupplies = await computerService.getPowerSupplies();
    const availableCases = await computerService.getCases();
    const availableStorage = await computerService.getStorage();

    const promptText = `
    Given the following user prompt, return a JSON object with the best PC components that match the user's needs.
    IMPORTANT: Only use motherboards from the provided list below. Do not suggest motherboards that are not in this list.

    User Prompt: "${prompt}"

    Available Motherboards:
    ${availableMotherboards.map(m => m.name).join(", ")}

    The AI should:
    - Stay within the Budget range the user gave
    - Suggest a PC build that is within the budget with the following components:
      - CPU name
      - GPU name
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
        threshold: 0.3,
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

      // Match parts
      const matchedMotherboard = fuseMotherboards.search(jsonResponse.motherboard)[0]?.item;
      const matchedCPU = fuseCPUs.search(jsonResponse.cpu)[0]?.item;
      const matchedGPU = fuseGPUs.search(jsonResponse.gpu)[0]?.item;
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

      const matchedParts = {
        cpu: cpuDetails ? { ...cpuDetails, imageUrl: formatImageUrl(cpuDetails.imageUrl) } : null,
        gpu: gpuDetails ? { ...gpuDetails, imageUrl: formatImageUrl(gpuDetails.imageUrl) } : null,
        memory: ramDetails ? { ...ramDetails, imageUrl: formatImageUrl(ramDetails.imageUrl) } : null,
        powerSupply: psuDetails ? { ...psuDetails, imageUrl: formatImageUrl(psuDetails.imageUrl) } : null,
        case: caseDetails ? { ...caseDetails, imageUrl: formatImageUrl(caseDetails.imageUrl) } : null,
        storage: hddDetails ? { ...hddDetails, imageUrl: formatImageUrl(hddDetails.imageUrl) } : null,
        storage2: ssdDetails ? { ...ssdDetails, imageUrl: formatImageUrl(ssdDetails.imageUrl) } : null,
        motherboard: motherboardDetails ? { ...motherboardDetails, imageUrl: formatImageUrl(motherboardDetails.imageUrl) } : null,
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
      threshold: 0.3,
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
      threshold: 0.3,
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
    Based on the following PC components, estimate the average FPS for each graphical preset (low, medium, high, ultra) for the following games:

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
      threshold: 0.3,
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

      return matchedPartDetails ? { ...matchedPartDetails, type: partType, imageUrl: formatImageUrl(matchedPartDetails.imageUrl) } : null;
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
}

  
};
