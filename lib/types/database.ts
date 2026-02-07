export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          password_hash: string;
          role: string;
          created_at: string;
          last_login: string | null;
        };
        Insert: {
          id?: string;
          email: string;
          password_hash: string;
          role?: string;
          created_at?: string;
          last_login?: string | null;
        };
        Update: {
          id?: string;
          email?: string;
          password_hash?: string;
          role?: string;
          created_at?: string;
          last_login?: string | null;
        };
        Relationships: [];
      };
      teachers: {
        Row: {
          id: string;
          name: string;
          subject: string | null;
          department: string | null;
          bio: string | null;
          image_url: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject?: string | null;
          department?: string | null;
          bio?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject?: string | null;
          department?: string | null;
          bio?: string | null;
          image_url?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      ratings: {
        Row: {
          id: string;
          teacher_id: string;
          stars: number;
          anonymous_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          stars: number;
          anonymous_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          stars?: number;
          anonymous_id?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ratings_teacher_id_fkey';
            columns: ['teacher_id'];
            referencedRelation: 'teachers';
            referencedColumns: ['id'];
          }
        ];
      };
      comments: {
        Row: {
          id: string;
          teacher_id: string;
          comment_text: string;
          anonymous_id: string;
          is_approved: boolean;
          is_flagged: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          comment_text: string;
          anonymous_id: string;
          is_approved?: boolean;
          is_flagged?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          comment_text?: string;
          anonymous_id?: string;
          is_approved?: boolean;
          is_flagged?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comments_teacher_id_fkey';
            columns: ['teacher_id'];
            referencedRelation: 'teachers';
            referencedColumns: ['id'];
          }
        ];
      };
      comment_reactions: {
        Row: {
          id: string;
          comment_id: string;
          anonymous_id: string;
          reaction: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          comment_id: string;
          anonymous_id: string;
          reaction: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          comment_id?: string;
          anonymous_id?: string;
          reaction?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'comment_reactions_comment_id_fkey';
            columns: ['comment_id'];
            referencedRelation: 'comments';
            referencedColumns: ['id'];
          }
        ];
      };
      suggestions: {
        Row: {
          id: string;
          type: string;
          title: string | null;
          description: string;
          status: string;
          teacher_name: string | null;
          department: string | null;
          subject: string | null;
          level: string | null;
          year_level: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          type: string;
          title?: string | null;
          description: string;
          status?: string;
          teacher_name?: string | null;
          department?: string | null;
          subject?: string | null;
          level?: string | null;
          year_level?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          type?: string;
          title?: string | null;
          description?: string;
          status?: string;
          teacher_name?: string | null;
          department?: string | null;
          subject?: string | null;
          level?: string | null;
          year_level?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      suggestion_votes: {
        Row: {
          id: string;
          suggestion_id: string;
          anonymous_id: string;
          vote: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          suggestion_id: string;
          anonymous_id: string;
          vote: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          suggestion_id?: string;
          anonymous_id?: string;
          vote?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'suggestion_votes_suggestion_id_fkey';
            columns: ['suggestion_id'];
            referencedRelation: 'suggestions';
            referencedColumns: ['id'];
          }
        ];
      };
      app_settings: {
        Row: {
          id: string;
          comments_require_approval: boolean | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          comments_require_approval?: boolean | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          comments_require_approval?: boolean | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      leaderboard_cache: {
        Row: {
          id: string;
          teacher_id: string;
          week_start: string;
          week_end: string;
          total_ratings: number;
          average_rating: number | null;
          total_comments: number;
          rank_position: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          teacher_id: string;
          week_start: string;
          week_end: string;
          total_ratings?: number;
          average_rating?: number | null;
          total_comments?: number;
          rank_position?: number | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          teacher_id?: string;
          week_start?: string;
          week_end?: string;
          total_ratings?: number;
          average_rating?: number | null;
          total_comments?: number;
          rank_position?: number | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'leaderboard_cache_teacher_id_fkey';
            columns: ['teacher_id'];
            referencedRelation: 'teachers';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: {
      current_week_leaderboard: {
        Row: {
          id: string;
          name: string;
          subject: string | null;
          department: string | null;
          image_url: string | null;
          rating_count: number;
          average_rating: number | null;
          comment_count: number;
        };
        Relationships: [];
      };
      teacher_stats: {
        Row: {
          id: string;
          name: string;
          total_ratings: number;
          overall_rating: number | null;
          total_comments: number;
        };
        Relationships: [];
      };
    };
    Functions: {
      update_weekly_leaderboard: {
        Args: Record<PropertyKey, never>;
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
  };
}

// Extended types for application usage
export type Teacher = Database['public']['Tables']['teachers']['Row'];
export type TeacherInsert = Database['public']['Tables']['teachers']['Insert'];
export type TeacherUpdate = Database['public']['Tables']['teachers']['Update'];

export type Rating = Database['public']['Tables']['ratings']['Row'];
export type RatingInsert = Database['public']['Tables']['ratings']['Insert'];

export type Comment = Database['public']['Tables']['comments']['Row'];
export type CommentInsert = Database['public']['Tables']['comments']['Insert'];
export type CommentUpdate = Database['public']['Tables']['comments']['Update'];
export type Suggestion = Database['public']['Tables']['suggestions']['Row'];
export type SuggestionInsert = Database['public']['Tables']['suggestions']['Insert'];
export type SuggestionUpdate = Database['public']['Tables']['suggestions']['Update'];
export type SuggestionVote = Database['public']['Tables']['suggestion_votes']['Row'];

export type LeaderboardEntry = Database['public']['Views']['current_week_leaderboard']['Row'];
export type TeacherStats = Database['public']['Views']['teacher_stats']['Row'];

// Extended types with relationships
export interface TeacherWithStats extends Teacher {
  total_ratings?: number;
  average_rating?: number | null;
  total_comments?: number;
}

export interface CommentWithTeacher extends Comment {
  teacher?: Teacher;
}

export interface RatingStats {
  average: number;
  total: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
