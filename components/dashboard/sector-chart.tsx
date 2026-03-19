"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, Legend } from "recharts";

const data = [
    { name: "Saúde", value: 400, color: "#ef4444" },
    { name: "Educação", value: 300, color: "#3b82f6" },
    { name: "Infraestrutura", value: 300, color: "#f59e0b" },
    { name: "Cultura", value: 200, color: "#10b981" },
];

export function SectorChart() {
    return (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle>Distribuição por Setor</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </CardContent>
        </Card>
    );
}
