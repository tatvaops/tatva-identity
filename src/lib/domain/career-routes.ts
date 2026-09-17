export const CAREERS_PATH = "/careers";

export function careerJobPath(jobId: string) {
  return `${CAREERS_PATH}/${encodeURIComponent(jobId)}`;
}
