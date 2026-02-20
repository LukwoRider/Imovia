import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface PhoneInputProps
    extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    defaultValue?: string;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
    ({ className, name, id, defaultValue = "", required, ...props }, ref) => {
        // Extract prefix and number if defaultValue exists
        const match = defaultValue.match(/^(\+\d{2,3})(.*)$/)
        const initialPrefix = match ? match[1] : "+33"
        const initialNumber = match ? match[2].trim() : defaultValue.replace(/^\+33/, "")

        const [prefix, setPrefix] = React.useState(initialPrefix)
        const [number, setNumber] = React.useState(initialNumber)

        // Hidden input combines them for the native form submission
        const combinedValue = `${prefix}${number.replace(/\s/g, "")}`

        const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            // Allow only numbers
            const val = e.target.value.replace(/[^0-9]/g, "")
            setNumber(val)
        }

        return (
            <div className={cn("flex relative", className)}>
                <select
                    value={prefix}
                    onChange={(e) => setPrefix(e.target.value)}
                    className="h-11 rounded-l-md border border-r-0 border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-transparent transition-colors z-10"
                >
                    <option value="+33">🇫🇷 +33</option>
                    <option value="+213">🇩🇿 +213</option>
                    <option value="+32">🇧🇪 +32</option>
                    <option value="+41">🇨🇭 +41</option>
                    <option value="+44">🇬🇧 +44</option>
                    <option value="+1">🇺🇸 +1</option>
                    <option value="+212">🇲🇦 +212</option>
                    <option value="+216">🇹🇳 +216</option>
                </select>

                <Input
                    type="tel"
                    ref={ref}
                    className="rounded-l-none pl-3 h-11"
                    placeholder="0612345678"
                    value={number}
                    onChange={handleNumberChange}
                    maxLength={15}
                    {...props}
                />

                <input
                    type="hidden"
                    name={name}
                    id={id}
                    value={combinedValue}
                    required={required && number.length === 0}
                />
            </div>
        )
    }
)
PhoneInput.displayName = "PhoneInput"
