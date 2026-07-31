export interface ProjectStat {
  id: string;
  metric: string;
  value: string;
}

export interface ProjectLink {
  id: string;
  label: string;
  url: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  detailedDescription: string;
  images: string[];
  tags: string[];
  acclaim: string[];
  tools: string[];
  skills: string[];
  stats: ProjectStat[];
  shape: 'square' | 'rect-h' | 'rect-v' | 'circle';
  size: 'small' | 'medium';
  links: ProjectLink[];
  dateStarted: string;
  dateCompleted: string;
  createdAt: string;
  updatedAt: string;
  featured: boolean;
}


