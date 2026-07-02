import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Eye, EyeOff, Save, Check } from 'lucide-react';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import api from '@/config/api';

const SettingRow = ({ setting }: { setting: any }) => {
  const queryClient = useQueryClient();
  const [value, setValue] = useState(setting.value || '');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const isSensitive = setting.type === 'password' || setting.key.toLowerCase().includes('secret') || setting.key.toLowerCase().includes('password') || setting.key.toLowerCase().includes('key');

  const mutation = useMutation({
    mutationFn: async (newValue: string) => {
      const res = await api.put(`/settings/${setting.id}`, { value: newValue });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }
  });

  const handleSave = () => {
    mutation.mutate(value);
  };

  return (
    <div className="flex items-start justify-between py-4 border-b last:border-0 hover:bg-muted/10 transition-colors px-2 rounded -mx-2">
      <div className="flex-1 pr-8">
        <h4 className="font-medium text-sm">{setting.key.replace(/_/g, ' ').toUpperCase()}</h4>
        <p className="text-xs text-muted-foreground mt-1">{setting.description || 'No description available.'}</p>
      </div>
      <div className="w-96 flex items-center gap-2">
        <div className="relative flex-1">
          {setting.type === 'boolean' ? (
             <select 
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={value} 
              onChange={(e) => setValue(e.target.value)}
            >
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </select>
          ) : (
            <>
              <Input
                type={isSensitive && !showPassword ? 'password' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className={isSensitive ? 'pr-10' : ''}
              />
              {isSensitive && (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              )}
            </>
          )}
        </div>
        <Button 
          size="icon" 
          variant={isSaved ? "default" : "secondary"}
          onClick={handleSave} 
          disabled={mutation.isPending || value === setting.value}
          title="Save setting"
        >
          {isSaved ? <Check size={16} /> : <Save size={16} />}
        </Button>
      </div>
    </div>
  );
};

export default function SettingsAdmin() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const res = await api.get('/settings', { params: { per_page: 200 } });
      return res.data;
    },
  });

  const settings = data?.data || [];
  
  // Filter by search
  const filteredSettings = settings.filter((s: any) => 
    s.key.toLowerCase().includes(search.toLowerCase()) || 
    (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
    (s.group && s.group.toLowerCase().includes(search.toLowerCase()))
  );

  // Group by category
  const groupedSettings = filteredSettings.reduce((acc: any, setting: any) => {
    const group = setting.group || 'General';
    if (!acc[group]) acc[group] = [];
    acc[group].push(setting);
    return acc;
  }, {});

  const groups = Object.keys(groupedSettings).sort();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">Configure global application parameters and integrations.</p>
      </div>

      <div className="flex justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-72">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search settings..." 
            className="pl-8" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 text-center text-muted-foreground">Loading settings...</div>
      ) : (
        <div className="space-y-8">
          {groups.length === 0 && (
            <div className="p-8 text-center text-muted-foreground bg-card rounded-lg border shadow-sm">
              No settings match your search.
            </div>
          )}
          
          {groups.map((group) => (
            <div key={group} className="bg-card border rounded-lg shadow-sm overflow-hidden">
              <div className="bg-muted/50 px-6 py-3 border-b">
                <h3 className="font-semibold text-foreground capitalize">{group}</h3>
              </div>
              <div className="p-6">
                {groupedSettings[group].map((setting: any) => (
                  <SettingRow key={setting.id} setting={setting} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
