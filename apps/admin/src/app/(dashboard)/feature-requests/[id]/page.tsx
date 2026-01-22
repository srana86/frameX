import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

const SERVER_URL = process.env.API_URL || "http://localhost:5000";

interface FeatureRequest {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  votes: number;
  createdAt: string;
}

// Fetch data from server API
async function getRequest(id: string): Promise<FeatureRequest | null> {
  try {
    const res = await fetch(`${SERVER_URL}/api/v1/feature-requests/${id}`, {
      cache: "no-store",
    });

    if (!res.ok) return null;

    const response = await res.json();
    return response.data || null;
  } catch (error) {
    // console.error("Error fetching feature request:", error);
    return null;
  }
}

export default async function FeatureRequestPage({
  params,
}: {
  params: { id: string };
}) {
  const request = await getRequest(params.id);

  if (!request) {
    notFound();
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-4">{request.title}</h1>
      <p className="text-gray-600 mb-6">{request.description}</p>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <span className="font-semibold">Status:</span> {request.status}
        </div>
        <div>
          <span className="font-semibold">Priority:</span> {request.priority}
        </div>
        <div>
          <span className="font-semibold">Votes:</span> {request.votes}
        </div>
      </div>

      <form
        action={async (formData) => {
          "use server";

          const status = formData.get("status") as string;
          const priority = formData.get("priority") as string;

          if (status || priority) {
            try {
              const updates: any = {};
              if (status) updates.status = status;
              if (priority) updates.priority = priority;

              await fetch(`${SERVER_URL}/api/v1/feature-requests/${params.id}`, {
                method: "PUT", // Server uses PUT for update
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(updates),
              });

              revalidatePath(`/feature-requests/${params.id}`);
            } catch (error) {
              console.error("Error updating request:", error);
            }
          }
        }}
        className="space-y-4 max-w-md"
      >
        <div>
          <label className="block text-sm font-medium mb-1">Update Status</label>
          <select
            name="status"
            defaultValue={request.status}
            className="w-full border rounded p-2"
          >
            <option value="PENDING">Pending</option>
            <option value="PLANNED">Planned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Update Priority</label>
          <select
            name="priority"
            defaultValue={request.priority}
            className="w-full border rounded p-2"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Update Request
        </button>
      </form>
    </div>
  );
}
