
import React, { useState, useEffect } from 'react';
import { User } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Paintbrush, Shirt, Beaker, Target, Gamepad2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import DrawingManager from '../components/admin/DrawingManager';
import FashionManager from '../components/admin/FashionManager';
import LiquidManager from '../components/admin/LiquidManager';
import CardManager from '../components/admin/CardManager';
import GameManager from '../components/admin/GameManager';

export default function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const user = await User.me();
      if (user?.role !== 'admin') {
        window.location.href = createPageUrl('Home');
        return;
      }
      setIsAdmin(true);
      setLoading(false);
    } catch (err) {
      console.error("Error checking admin access:", err);
      window.location.href = createPageUrl('Home');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">פאנל ניהול</h1>
          <Link to={createPageUrl('Home')}>
            <Button variant="outline">חזרה למסך הבית</Button>
          </Link>
        </div>

        <Card className="p-6">
          <Tabs defaultValue="games">
            <TabsList className="mb-6">
              <TabsTrigger value="games" className="flex items-center gap-2">
                <Gamepad2 className="w-4 h-4" />
                ניהול משחקים
              </TabsTrigger>
              <TabsTrigger value="fashion" className="flex items-center gap-2">
                <Shirt className="w-4 h-4" />
                משחק הלבשה
              </TabsTrigger>
              <TabsTrigger value="drawing" className="flex items-center gap-2">
                <Paintbrush className="w-4 h-4" />
                משחק צביעה
              </TabsTrigger>
              <TabsTrigger value="liquid" className="flex items-center gap-2">
                <Beaker className="w-4 h-4" />
                משחק הנוזלים
              </TabsTrigger>
              <TabsTrigger value="cards" className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                משחק הזיכרון
              </TabsTrigger>
            </TabsList>

            <TabsContent value="games">
              <GameManager />
            </TabsContent>

            <TabsContent value="fashion">
              <FashionManager />
            </TabsContent>

            <TabsContent value="drawing">
              <DrawingManager />
            </TabsContent>

            <TabsContent value="liquid">
              <LiquidManager />
            </TabsContent>
            
            <TabsContent value="cards">
              <CardManager />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
