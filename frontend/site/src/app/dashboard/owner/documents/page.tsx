import { DocumentsClient } from "@/components/dashboard/owner/documents/documents-client"
import { DocumentsSidebar } from "@/components/dashboard/owner/documents/documents-sidebar"

export default function OwnerDocumentsPage() {
    return (
        <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-2 mb-8">
                <h1 className="text-2xl font-bold text-[#12182C]">Mes Documents</h1>
                <p className="text-slate-500">Accédez à tous vos documents de location</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Main Content */}
                <div className="lg:col-span-8">
                    <DocumentsClient />
                </div>

                {/* Right Sidebar */}
                <aside className="lg:col-span-4 space-y-6">
                    <DocumentsSidebar />
                </aside>
            </div>
        </div>
    )
}
