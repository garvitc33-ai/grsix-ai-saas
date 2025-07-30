// frontend/src/services/knowledgeBaseService.js
import axios from "axios";

const BASE_URL = "http://localhost:3010/api/knowledgebase"; // fixed route path

export const fetchAllKnowledgeBases = async () => {
  const res = await axios.get(`${BASE_URL}`);
  return res.data;
};

export const fetchSingleKB = async (id) => {
  const res = await axios.get(`${BASE_URL}/id/${id}`);
  return res.data;
};

// ✅ New: Save AI-generated KB (from website)
export const createKnowledgeBase = async ({ companyName, content }) => {
  const res = await axios.post(`${BASE_URL}/save-ai`, {
    companyName,
    content,
  });
  return res.data;
};

// ✅ Upload file + company name (manual upload)
export const uploadKnowledgeBase = async (formData) => {
  const res = await axios.post(`${BASE_URL}/upload`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};
