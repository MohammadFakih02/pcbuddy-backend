import { GoogleGenerativeAI } from "@google/generative-ai";
import { ComputerService } from "./computer.service";
import Fuse from "fuse.js";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
const computerService = new ComputerService();

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
    - Estimate a budget range for the PC (e.g., between $0 and $10000).
    - Suggest a PC build with the following components:
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
        cpu: cpuDetails,
        gpu: gpuDetails,
        ram: ramDetails,
        psu: psuDetails,
        case: caseDetails,
        hdd: hddDetails,
        ssd: ssdDetails,
        motherboard: motherboardDetails,
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
  }
};