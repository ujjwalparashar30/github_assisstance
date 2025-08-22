import axios from "axios";

export class GitHubService {
  private baseUrl = "https://api.github.com/search/issues";

  async fetchRecommendedIssues(keywords: string[], skillLevel: string) {
    const labels = this.mapSkillLevelToLabels(skillLevel);
    const query = this.buildQuery(keywords, labels);

    const url = `${this.baseUrl}?q=${encodeURIComponent(query)}&sort=updated&order=desc&per_page=10`;

    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
    });

    return response.data.items;
  }

  private mapSkillLevelToLabels(skillLevel: string): string[] {
    if (skillLevel === "Beginner") return ['"good first issue"', "beginner"];
    if (skillLevel === "Intermediate") return ['"help wanted"'];
    if (skillLevel === "Advanced") return ["advanced", "discussion"];
    return [];
  }

  private buildQuery(keywords: string[], labels: string[]): string {
    const keywordPart = keywords.map(k => `${k}`).join("+");
    const labelPart = labels.map(l => `label:${l}`).join("+");
    return `is:issue is:open ${keywordPart} ${labelPart} stars:>100`;
  }
}
