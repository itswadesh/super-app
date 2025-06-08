export interface Subject {
    id: number;
    name: string;
    slug: string;
    description: string;
    gradeLevel: string;
    board: string;
    metaTitle: string;
    metaDescription: string;
    image: string;
    thumbnailUrl?: string;
    totalChapters: number;
    totalLessons: number;
    totalTimeMinutes: number;
    type?: string;
    children?: Subject[];
}

export interface Chapter {
    id: number;
    name: string;
    slug: string;
    description: string;
    order: number;
    totalLessons: number;
    totalTimeMinutes: number;
}

export interface LearningContent {
    id: number;
    title: string;
    slug: string;
    type: "video" | "notes" | "quiz";
    description: string;
    image: string;
    thumbnailUrl?: string;
    duration?: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    tags: string[];
    progress?: number;
    completionStatus?: "not_started" | "in_progress" | "completed";
    price?: number;
    salePrice?: number;
    isFeatured?: boolean;
    stock?: number;
    rank?: number;
    createdAt?: string;
    updatedAt?: string;
    categoryId?: string;
    sku?: string;
    features?: string[];
    specifications?: Record<string, any>;
}

export interface FilterOption {
    id: string;
    name: string;
    options: string[];
}

export interface ContentFilter {
    [key: string]: string[];
}
