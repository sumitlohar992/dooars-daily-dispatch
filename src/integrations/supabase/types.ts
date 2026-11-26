export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      articles: {
        Row: {
          author_id: string | null;
          author_name: string;
          body: string;
          category: string;
          created_at: string;
          id: string;
          image_url: string | null;
          image_urls: string[];
          image_is_ai: boolean;
          is_breaking: boolean;
          media_watch_seconds: number;
          source_name: string | null;
          source_language: "en" | "bn" | "hi" | null;
          source_url: string | null;
          summary: string | null;
          title: string;
          video_url: string | null;
          views: number;
        };
        Insert: {
          author_id?: string | null;
          author_name?: string;
          body?: string;
          category?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          image_urls?: string[];
          image_is_ai?: boolean;
          is_breaking?: boolean;
          media_watch_seconds?: number;
          source_name?: string | null;
          source_language?: "en" | "bn" | "hi" | null;
          source_url?: string | null;
          summary?: string | null;
          title: string;
          video_url?: string | null;
          views?: number;
        };
        Update: {
          author_id?: string | null;
          author_name?: string;
          body?: string;
          category?: string;
          created_at?: string;
          id?: string;
          image_url?: string | null;
          image_urls?: string[];
          image_is_ai?: boolean;
          is_breaking?: boolean;
          media_watch_seconds?: number;
          source_name?: string | null;
          source_language?: "en" | "bn" | "hi" | null;
          source_url?: string | null;
          summary?: string | null;
          title?: string;
          video_url?: string | null;
          views?: number;
        };
        Relationships: [];
      };
      banned_emails: {
        Row: {
          created_at: string;
          email: string;
          reason: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          reason?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          reason?: string | null;
        };
        Relationships: [];
      };
      bookmarks: {
        Row: {
          article_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          article_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          article_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "bookmarks_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      comments: {
        Row: {
          article_id: string;
          body: string;
          created_at: string;
          id: string;
          user_id: string;
          user_name: string;
        };
        Insert: {
          article_id: string;
          body: string;
          created_at?: string;
          id?: string;
          user_id: string;
          user_name: string;
        };
        Update: {
          article_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          user_id?: string;
          user_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "comments_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      follows: {
        Row: {
          created_at: string;
          follower_id: string;
          following_id: string;
        };
        Insert: {
          created_at?: string;
          follower_id: string;
          following_id: string;
        };
        Update: {
          created_at?: string;
          follower_id?: string;
          following_id?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          body: string;
          created_at: string;
          file_name: string | null;
          file_type: string | null;
          file_url: string | null;
          id: string;
          recipient_id: string;
          sender_id: string;
        };
        Insert: {
          body?: string;
          created_at?: string;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          recipient_id: string;
          sender_id: string;
        };
        Update: {
          body?: string;
          created_at?: string;
          file_name?: string | null;
          file_type?: string | null;
          file_url?: string | null;
          id?: string;
          recipient_id?: string;
          sender_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          display_name: string | null;
          id: string;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
        };
        Relationships: [];
      };
      reactions: {
        Row: {
          article_id: string;
          created_at: string;
          user_id: string;
        };
        Insert: {
          article_id: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          article_id?: string;
          created_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reactions_article_id_fkey";
            columns: ["article_id"];
            isOneToOne: false;
            referencedRelation: "articles";
            referencedColumns: ["id"];
          },
        ];
      };
      slides: {
        Row: {
          created_at: string;
          id: string;
          link: string | null;
          sort: number;
          title: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          link?: string | null;
          sort?: number;
          title: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          link?: string | null;
          sort?: number;
          title?: string;
        };
        Relationships: [];
      };
      social_live_streams: {
        Row: {
          created_at: string;
          id: string;
          platform: string;
          stream_url: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          platform: string;
          stream_url: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          platform?: string;
          stream_url?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_details: {
        Row: {
          address: string | null;
          city: string | null;
          full_name: string | null;
          last_seen_at: string;
          phone: string | null;
          photo_url: string | null;
          pincode: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          address?: string | null;
          city?: string | null;
          full_name?: string | null;
          last_seen_at?: string;
          phone?: string | null;
          photo_url?: string | null;
          pincode?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          address?: string | null;
          city?: string | null;
          full_name?: string | null;
          last_seen_at?: string;
          phone?: string | null;
          photo_url?: string | null;
          pincode?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      admin_stats: { Args: never; Returns: Json };
      are_connected: { Args: { _a: string; _b: string }; Returns: boolean };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      record_view: { Args: { _article_id: string }; Returns: undefined };
      record_media_watch: {
        Args: { _article_id: string; _active: boolean };
        Returns: undefined;
      };
    };
    Enums: {
      app_role: "admin" | "user";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const;
