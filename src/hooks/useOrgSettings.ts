import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const useOrgSettings = () => {
  return useQuery({
    queryKey: ['org-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_settings')
        .select('*')
        .order('setting_key');

      if (error) throw error;
      return data || [];
    },
  });
};

export const useUpdateOrgSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ settingKey, settingValue }: { settingKey: string; settingValue: string }) => {
      const { data, error } = await supabase
        .from('org_settings')
        .upsert({
          setting_key: settingKey,
          setting_value: settingValue,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'setting_key'
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org-settings'] });
      toast({
        title: "Success",
        description: "Setting updated successfully",
      });
    },
    onError: (error) => {
      console.error('Error updating setting:', error);
      toast({
        title: "Error",
        description: "Failed to update setting",
        variant: "destructive",
      });
    },
  });
};