import { Status } from "../entities/Status";

export interface StatusRepository {
  /**
   * Get all available statuses from the database
   * @returns Promise<Status[]> - List of all statuses
   */
  getAllStatuses(): Promise<Status[]>;

  /**
   * Get a specific status by ID
   * @param id_status - The ID of the status to retrieve
   * @returns Promise<Status | null> - The status if found, null otherwise
   */
  getStatusById(id_status: number): Promise<Status | null>;
}
