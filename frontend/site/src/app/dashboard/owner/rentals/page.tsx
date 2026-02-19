import { RentalList } from "@/components/dashboard/owner/rentals/rental-list"

export default function OwnerRentalsPage() {
    return (
        <div className="space-y-8 max-w-5xl mx-auto w-full">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-[#12182C]">Mes locations</h1>
                <p className="text-slate-500">Suivez vos locations et les paiements</p>
            </div>

            <RentalList />
        </div>
    )
}
