import { AlertTriangle, Clock, Info, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface AlertItem {
    skuId: string;
    name: string;
    [key: string]: any;
}

export function SystemAlerts({ lowStock, expiring }: { lowStock: AlertItem[], expiring: AlertItem[] }) {
    const totalAlerts = lowStock.length + expiring.length;

    if (totalAlerts === 0) return null;

    return (
        <div className="bg-white dark:bg-zinc-950 border border-amber-200 dark:border-amber-900/50 rounded-xl overflow-hidden shadow-sm">
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="alerts" className="border-b-0">
                    <AccordionTrigger className="px-4 py-3 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 hover:no-underline [&[data-state=open]>div>svg]:rotate-180">
                        <div className="flex items-center gap-3 text-sm">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500">
                                <Info className="h-4 w-4" />
                            </div>
                            <div className="flex flex-col items-start gap-1">
                                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                                    Pusat Perhatian Sistem
                                </span>
                                <div className="flex items-center gap-2 text-xs text-zinc-500 font-normal">
                                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
                                        <AlertTriangle className="h-3 w-3" />
                                        {lowStock.length} Stok Kritis
                                    </span>
                                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                                    <span className="flex items-center gap-1 text-rose-600 dark:text-rose-500">
                                        <Clock className="h-3 w-3" />
                                        {expiring.length} Segera Kadaluarsa
                                    </span>
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="pl-[2.75rem] flex flex-col gap-3 mt-2 pr-4">
                            {lowStock.length > 0 && (
                                <div className="space-y-1.5">
                                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                                        Item Stok Menipis
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {lowStock.map((item, i) => (
                                            <Badge key={i} variant="outline" className="bg-white dark:bg-zinc-900 text-amber-700 border-amber-200 dark:border-amber-800 font-normal py-0.5">
                                                {item.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {expiring.length > 0 && (
                                <div className="space-y-1.5 pt-1">
                                    <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                                        Item Segera Kadaluarsa (H-3)
                                    </h4>
                                    <div className="flex flex-wrap gap-1.5">
                                        {expiring.map((item, i) => (
                                            <Badge key={i} variant="outline" className="bg-white dark:bg-zinc-900 text-rose-700 border-rose-200 dark:border-rose-800 font-normal py-0.5">
                                                {item.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
}
