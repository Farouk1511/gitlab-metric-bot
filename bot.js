require('dotenv').config();
const axios = require('axios');

const GITLAB_API_URL = process.env.GITLAB_API_URL;
const ACCESS_TOKEN = process.env.ACCESS_TOKEN2;
const PROJECT_ID = process.env.PROJECT_ID;

const headers = {
  'Private-Token': ACCESS_TOKEN
};

async function getMergeRequests() {
  const url = `${GITLAB_API_URL}/projects/${PROJECT_ID}/merge_requests`;
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error('Error fetching merge requests:', error);
    return [];
  }
}

function calculateMetrics(mergeRequests) {
    const metrics = {
      totalMRs: mergeRequests.length,
      acceptedWithoutChanges: 0,
      changesRequested: 0,
      totalComments: 0,
      timeToMerge: []
    };
  
    mergeRequests.forEach(mr => {
      if (mr.state === 'merged') {
        const changesRequested = mr.changes_count || 0;
        metrics.changesRequested += changesRequested;
  
        if (changesRequested === 0) {
          metrics.acceptedWithoutChanges += 1;
        }
  
        const createdAt = new Date(mr.created_at);
        const mergedAt = new Date(mr.merged_at);
        const timeToMerge = (mergedAt - createdAt) / (1000 * 3600);
        metrics.timeToMerge.push(timeToMerge);
  
        metrics.totalComments += mr.user_notes_count;
      }
    });
  
    metrics.timeToMergeAvg = metrics.timeToMerge.length
      ? metrics.timeToMerge.reduce((a, b) => a + b, 0) / metrics.timeToMerge.length
      : 0;
  
    return metrics;
  }
  
  function displayMetrics(metrics) {
    console.log(`Total MRs: ${metrics.totalMRs}`);
    console.log(`Accepted without changes: ${metrics.acceptedWithoutChanges}`);
    console.log(`Changes requested: ${metrics.changesRequested}`);
    console.log(`Total comments: ${metrics.totalComments}`);
    console.log(`Average time to merge (hours): ${metrics.timeToMergeAvg.toFixed(2)}`);
  }

  async function job() {
    const mergeRequests = await getMergeRequests();
    const metrics = calculateMetrics(mergeRequests);
    displayMetrics(metrics);
  }

  job()