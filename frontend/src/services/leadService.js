// src/services/leadService.js
import api from "./api";

export const fetchLeads = async () => {
  try {
    const response = await api.get("/leads");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch leads", error);
    return [];
  }
};

export const createKnowledgeBase = async (data) => {
  try {
    const response = await api.post("/knowledgebase", data);
    return response.data;
  } catch (error) {
    console.error("Failed to create knowledge base", error);
    throw error;
  }
};
