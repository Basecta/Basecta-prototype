'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPinIcon, PlusIcon, LeafIcon } from 'lucide-react';
import { AddFarmDrawer } from '@/components/add-farm-drawer';

interface Farm {
  id: string;
  name: string;
  location: string;
  biodiversityCredits: number;
  income: number;
}

const initialFarms: Farm[] = [
  { id: '1', name: 'Green Valley Farm', location: 'County Cork, Ireland', biodiversityCredits: 1247, income: 2450 },
  { id: '2', name: 'Sunrise Meadows', location: 'County Kerry, Ireland', biodiversityCredits: 1823, income: 3120 },
  { id: '3', name: 'Oakwood Estate', location: 'County Galway, Ireland', biodiversityCredits: 956, income: 1890 },
];

export default function AssetsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [farms, setFarms] = useState<Farm[]>(initialFarms);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleAddFarm = (data: { name: string; area: string; county: string; size: string; folioPdf: File | null }) => {
    const newFarm: Farm = {
      id: String(Date.now()),
      name: data.name,
      location: `${data.area}, County ${data.county}`,
      biodiversityCredits: 0,
      income: 0,
    };
    setFarms((prev) => [...prev, newFarm]);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');

    if (!token || !userData) {
      router.push('/login');
      return;
    }

    setUser(JSON.parse(userData));
  }, [router]);

  if (!user) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6">
      {farms.map((farm) => (
        <Link key={farm.id} href={`/farm/${farm.id}`} className="block">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{farm.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPinIcon className="size-3.5" />
                    {farm.location}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4 text-right">
                  <div>
                    <p className="text-xs text-muted-foreground">Credits</p>
                    <Badge variant="outline">
                      <LeafIcon className="size-3" />
                      {farm.biodiversityCredits.toLocaleString()}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Income</p>
                    <Badge variant="outline">
                      &euro;{farm.income.toLocaleString()}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        </Link>
      ))}

      <Card
        className="border-2 border-dashed cursor-pointer transition-colors hover:border-primary/50 hover:bg-accent"
        onClick={() => setDrawerOpen(true)}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <PlusIcon className="size-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground font-medium">Add new farm</p>
        </CardContent>
      </Card>

      <AddFarmDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onSubmit={handleAddFarm}
      />
    </div>
  );
}
