import { createClient } from "@supabase/supabase-js";
import { Status } from "../../domain/entities/Status";
import { StatusRepository } from "../../domain/repositories/StatusRepository";

export class SupabaseStatusRepository implements StatusRepository {
  private supabase = createClient(
    process.env.SUPABASE_URL || "",
    process.env.SUPABASE_KEY || ""
  );

  async getAllStatuses(): Promise<Status[]> {
    const { data, error } = await this.supabase
      .from("statuses")
      .select("*")
      .order("id_status", { ascending: true });

    if (error) {
      console.error("Error fetching statuses:", error);
      throw new Error(error.message);
    }

    return data.map(statusData => new Status({
      id_status: statusData.id_status,
      name: statusData.name
    }));
  }

  async getStatusById(id_status: number): Promise<Status | null> {
    const { data, error } = await this.supabase
      .from("statuses")
      .select("*")
      .eq("id_status", id_status)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows found
        return null;
      }
      console.error("Error fetching status:", error);
      throw new Error(error.message);
    }

    return new Status({
      id_status: data.id_status,
      name: data.name
    });
  }
}
