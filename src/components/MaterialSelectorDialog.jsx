import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const MaterialSelectorDialog = ({ isOpen, onOpenChange, userMaterials, globalMaterials, onSelectMaterial }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [activeTab, setActiveTab] = useState('user'); // 'user' or 'global'

    const getCategories = (materials) => {
        const categories = new Set();
        materials.forEach(m => m.category && categories.add(m.category));
        return ['all', ...Array.from(categories).sort()];
    };

    const userCategories = useMemo(() => getCategories(userMaterials), [userMaterials]);
    const globalCategories = useMemo(() => getCategories(globalMaterials), [globalMaterials]);

    const allCategories = activeTab === 'user' ? userCategories : globalCategories;

    const filteredMaterials = useMemo(() => {
        const sourceMaterials = activeTab === 'user' ? userMaterials : globalMaterials;
        return sourceMaterials.filter(m => {
            const nameMatch = m.name.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = selectedCategory === 'all' || m.category === selectedCategory;
            return nameMatch && categoryMatch;
        });
    }, [userMaterials, globalMaterials, searchTerm, selectedCategory, activeTab]);

    const handleSelect = (material) => {
        onSelectMaterial(material);
        onOpenChange(false);
    };

    const handleTabChange = (value) => {
        setActiveTab(value);
        setSelectedCategory('all');
        setSearchTerm('');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-4 border-b border-steel-gray">
                    <DialogTitle>Selecionar Material</DialogTitle>
                </DialogHeader>
                <div className="p-4 border-b border-steel-gray">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
                            <TabsList>
                                <TabsTrigger value="user">Meus Materiais</TabsTrigger>
                                <TabsTrigger value="global">Catálogo Global</TabsTrigger>
                            </TabsList>
                        </Tabs>
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por nome..."
                                className="pl-9 bg-steel-gray-dark border-steel-gray w-full"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex-grow flex overflow-hidden">
                    <div className="w-1/3 md:w-1/4 border-r border-steel-gray overflow-y-auto p-4 space-y-1">
                        <h3 className="font-semibold mb-2 px-2 text-white text-sm sm:text-base">Categorias</h3>
                        {allCategories.map(cat => (
                            <Button
                                key={cat}
                                variant="ghost"
                                onClick={() => setSelectedCategory(cat)}
                                className={cn(
                                    "w-full justify-start text-left h-auto py-2 px-2 whitespace-normal text-xs sm:text-sm",
                                    selectedCategory === cat ? "bg-metallic-orange/20 text-metallic-orange" : "text-gray-300 hover:bg-steel-gray"
                                )}
                            >
                                {cat === 'all' ? 'Todas as Categorias' : cat}
                            </Button>
                        ))}
                    </div>

                    <div className="w-2/3 md:w-3/4 flex flex-col overflow-y-auto">
                        {filteredMaterials.length > 0 ? (
                            <ul>
                                {filteredMaterials.map(m => (
                                    <li key={`${activeTab}-${m.id}`} className="flex justify-between items-center p-3 sm:p-4 border-b border-steel-gray/50 hover:bg-steel-gray/20 cursor-pointer" onClick={() => handleSelect(m)}>
                                        <div>
                                            <p className="font-medium text-white text-sm sm:text-base">{m.name}</p>
                                            <p className="text-xs sm:text-sm text-gray-400">{m.category || 'Sem categoria'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-white font-semibold text-sm sm:text-base">R$ {Number(m.cost).toFixed(2)}</p>
                                            <p className="text-xs sm:text-sm text-gray-400">/{m.unit}</p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="flex items-center justify-center h-full text-gray-400">
                                <p>Nenhum material encontrado.</p>
                            </div>
                        )}
                    </div>
                </div>
                <DialogFooter className="p-4 border-t border-steel-gray">
                    <Button variant="secondary" onClick={() => onOpenChange(false)}>Fechar</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default MaterialSelectorDialog;