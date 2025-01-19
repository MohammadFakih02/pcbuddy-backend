import Fuse from "fuse.js";
import axios from "axios";

const GOOGLE_CSE_ID = process.env.GOOGLE_CSE_ID;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;

// Helper function to format image URLs
export const formatImageUrl = (url: string | null | undefined): string | null | undefined => {
  if (url && url.startsWith('//')) {
    return `https:${url}`;
  }
  return url;
};

// Helper function to format part details with image URLs
export const formatPartDetails = (part: any) => {
  if (!part) return null;
  return {
    ...part,
    imageUrl: formatImageUrl(part.imageUrl),
  };
};

// Helper function for fuzzy matching
export const fuzzyMatch = (items: any[], searchTerm: string, options: any) => {
  const fuse = new Fuse(items, options);
  return fuse.search(searchTerm)[0]?.item;
};

// Helper function to fetch images based on prompts
export const fetchImages = async (prompts: string[]) => {
  const imageUrls = await Promise.all(
    prompts.map(async (prompt: string) => {
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

  return imageUrls.flat();
};