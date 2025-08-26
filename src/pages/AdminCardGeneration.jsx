import React, { useState, useEffect } from 'react';
import { Cards } from '@/api/entities';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function AdminCardGeneration() {
  const [cards, setCards] = useState([]);
  const [newCard, setNewCard] = useState({
    category: 'animals',
    term: '',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      const allCards = await Cards.list();
      setCards(allCards);
    } catch (error) {
      console.error('Error loading cards:', error);
    }
  };

  const handleAddCard = async () => {
    if (!newCard.term || !newCard.imageUrl) return;

    try {
      setLoading(true);
      await Cards.create(newCard);
      setNewCard({
        category: 'animals',
        term: '',
        imageUrl: ''
      });
      await loadCards();
    } catch (error) {
      console.error('Error adding card:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק קלף זה?')) return;

    try {
      await Cards.delete(cardId);
      await loadCards();
    } catch (error) {
      console.error('Error deleting card:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">ניהול קלפי משחק הזיכרון</h1>
          <Link to={createPageUrl('Game')}>
            <Button variant="outline">חזרה למשחק</Button>
          </Link>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>הוספת קלף חדש</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select
                  value={newCard.category}
                  onValueChange={(value) => setNewCard({ ...newCard, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="animals">חיות</SelectItem>
                    <SelectItem value="plants">צמחים</SelectItem>
                    <SelectItem value="vehicles">כלי תחבורה</SelectItem>
                    <SelectItem value="people">אנשים</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="שם הקלף"
                  value={newCard.term}
                  onChange={(e) => setNewCard({ ...newCard, term: e.target.value })}
                />

                <Input
                  placeholder="קישור לתמונה"
                  value={newCard.imageUrl}
                  onChange={(e) => setNewCard({ ...newCard, imageUrl: e.target.value })}
                />
              </div>

              <Button 
                onClick={handleAddCard} 
                disabled={loading || !newCard.term || !newCard.imageUrl}
                className="w-full"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                הוסף קלף
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Card key={card.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={card.imageUrl}
                  alt={card.term}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = `https://via.placeholder.com/200x200?text=${encodeURIComponent(card.term)}`;
                  }}
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => handleDeleteCard(card.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <CardContent className="p-3">
                <p className="font-medium truncate">{card.term}</p>
                <p className="text-sm text-gray-500">
                  {card.category === 'animals' ? 'חיות' :
                   card.category === 'plants' ? 'צמחים' :
                   card.category === 'vehicles' ? 'כלי תחבורה' : 'אנשים'}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}