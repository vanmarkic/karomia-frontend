export interface Tag {
  id: string;
  name: string;
  color: string;
  isHighlighted?: boolean;
}

export interface TaggedRange {
  from: number;
  to: number;
  tagIds: string[];
}

export interface ApiResponse {
  content: {
    value: string;
  };
}

export interface TextSelection {
  from: number;
  to: number;
  text: string;
}

export interface TagSpan {
  tagIds: string[];
  from: number;
  to: number;
}