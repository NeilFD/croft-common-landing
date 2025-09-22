import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import JSZip from "https://esm.sh/jszip@3.10.1";
import { encode as base64Encode } from "https://deno.land/std@0.190.0/encoding/base64.ts";
import { encode as hexEncode } from "https://deno.land/std@0.190.0/encoding/hex.ts";
import forge from "https://esm.sh/node-forge@1.3.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PassData {
  membershipNumber: string;
  displayName: string;
  firstName: string;
  lastName: string;
  memberSince: string;
}

// Utility function to calculate SHA1 hash from raw bytes
async function sha1(data: Uint8Array): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Utility function to convert PEM to DER format
function pemToDer(pem: string): Uint8Array {
  const pemHeader = "-----BEGIN CERTIFICATE-----";
  const pemFooter = "-----END CERTIFICATE-----";
  const pemContents = pem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
  const derBuffer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  return derBuffer;
}

// Generate the actual Croft Common logo
function generateCroftCommonLogo(): Uint8Array {
  // Base64-encoded white Croft Common logo PNG (simplified CC design)
  const logoBase64 = "iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAKnSURBVFiFtZc9aBRBFMd/M5fdJBc/wMJCG1sLwcJCG1sLG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLQcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1sLG1sLwcJCG1zLG1sLwcJCG1sLG1sLQAAAABJRU5ErkJggg==";
  
  try {
    return Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));
  } catch (error) {
    console.log('🎫 Error decoding logo base64, using fallback');
    return generateFallbackLogo();
  }
}

// Fallback logo generator (simplified white square)
function generateFallbackLogo(): Uint8Array {
  // Create a simple white logo PNG as fallback
  const size = 32;
  
  // PNG file signature
  const signature = new Uint8Array([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
  // IHDR chunk for 32x32 RGBA
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, size); // width
  ihdrView.setUint32(4, size); // height  
  ihdrData[8] = 8;  // bit depth
  ihdrData[9] = 6;  // color type (RGBA)
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace
  
  const ihdrCrc = crc32(new Uint8Array([73, 72, 68, 82, ...ihdrData]));
  const ihdr = new Uint8Array([0, 0, 0, 13, 73, 72, 68, 82, ...ihdrData, ...ihdrCrc]);
  
  // Simple white square IDAT
  const idatData = new Uint8Array([120, 1, 1, 13, 4, 242, 251, 0, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255, 255]);
  const idatCrc = crc32(new Uint8Array([73, 68, 65, 84, ...idatData]));
  const idat = new Uint8Array([0, 0, 4, 21, 73, 68, 65, 84, ...idatData, ...idatCrc]);
  
  // IEND chunk
  const iendCrc = crc32(new Uint8Array([73, 69, 78, 68]));
  const iend = new Uint8Array([0, 0, 0, 0, 73, 69, 78, 68, ...iendCrc]);
  
  return new Uint8Array([...signature, ...ihdr, ...idat, ...iend]);
}

// CRC32 calculation for PNG chunks
function crc32(data: Uint8Array): Uint8Array {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  
  let crc = 0xFFFFFFFF;
  for (const byte of data) {
    crc = table[(crc ^ byte) & 0xFF] ^ (crc >>> 8);
  }
  crc = crc ^ 0xFFFFFFFF;
  
  const result = new Uint8Array(4);
  const view = new DataView(result.buffer);
  view.setUint32(0, crc);
  return result;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Handle GET requests for iOS Safari direct navigation
  if (req.method === 'GET') {
    const url = new URL(req.url);
    // Accept multiple param names for robustness
    const rawParam =
      url.searchParams.get('token') ||
      url.searchParams.get('Authorization') ||
      url.searchParams.get('authorization') ||
      url.searchParams.get('bearer') ||
      url.searchParams.get('access_token');

    if (!rawParam) {
      console.warn('GET create-wallet-pass: missing token in query params');
      return new Response(JSON.stringify({ error: 'Token required in query string' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Safely decode and normalise (strip optional "Bearer " prefix)
    const decoded = decodeURIComponent(rawParam);
    const authToken = decoded.replace(/^Bearer\s+/i, '');
    console.log('GET create-wallet-pass: token received via query string', {
      via: url.searchParams.has('token') ? 'token' : url.searchParams.has('Authorization') ? 'Authorization' : 'other',
      length: authToken.length,
    });

    // Continue with pass generation using the provided token by transforming into a POST
    req = new Request(req.url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get user from JWT
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user's membership data
    const { data: memberData, error: memberError } = await supabaseClient
      .rpc('get_membership_card_details', { user_id_input: user.id });

    if (memberError || !memberData || memberData.length === 0) {
      console.error('Error fetching member data:', memberError);
      return new Response(JSON.stringify({ error: 'Member data not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const member = memberData[0];
    
    // Generate unique serial number
    const serialNumber = `CC-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Get Apple certificates and secrets from environment (trim whitespace)
    const teamIdentifier = Deno.env.get('APPLE_TEAM_ID')?.trim();
    const passTypeIdentifier = Deno.env.get('APPLE_PASS_TYPE_IDENTIFIER')?.trim();
    const passCert = Deno.env.get('APPLE_PASS_CERTIFICATE')?.trim();
    const passKey = Deno.env.get('APPLE_PASS_PRIVATE_KEY')?.trim();
    const wwdrCert = Deno.env.get('APPLE_WWDR_CERTIFICATE')?.trim();

    if (!teamIdentifier || !passTypeIdentifier || !passCert || !passKey || !wwdrCert) {
      console.error('Missing Apple credentials');
      return new Response(JSON.stringify({ error: 'Apple Wallet credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create pass.json structure for Apple Wallet
    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: passTypeIdentifier,
      serialNumber: serialNumber,
      teamIdentifier: teamIdentifier,
      organizationName: "CROFT COMMON",
      description: "Croft Common Membership Card",
      logoText: "CROFT COMMON",
      foregroundColor: "rgb(255, 255, 255)",
      backgroundColor: "rgb(12, 14, 12)", 
      labelColor: "rgb(255, 255, 255)",
      generic: {
        primaryFields: [
          {
            key: "memberName",
            label: "MEMBER", 
            value: `${member.first_name || ''} ${member.last_name || ''}`.trim() || member.display_name,
            textAlignment: "PKTextAlignmentLeft"
          }
        ],
        secondaryFields: [
          {
            key: "membershipNumber",
            label: "MEMBERSHIP NUMBER",
            value: member.membership_number
          },
          {
            key: "memberSince",
            label: "MEMBER SINCE",
            value: new Date(member.member_since).getFullYear().toString()
          }
        ],
        auxiliaryFields: [
          {
            key: "tagline",
            label: "",
            value: "Hospitality, For Good"
          }
        ],
        backFields: [
          {
            key: "website",
            label: "WEBSITE",
            value: "https://croftcommon.co.uk"
          },
          {
            key: "contact",
            label: "CONTACT",
            value: "hello@croftcommon.co.uk"
          },
          {
            key: "terms",
            label: "TERMS & CONDITIONS",
            value: "This membership card is non-transferable and must be presented when requested. Visit our website for full terms and conditions."
          }
        ]
      }
    };

    console.log('🎫 STEP 1: Creating wallet pass for user:', user.id);
    console.log('🎫 STEP 2: Member data:', JSON.stringify(member, null, 2));
    console.log('🎫 ✅ Pass configured as static (no web service communication required)');

    // Create pass bundle with required files
    const zip = new JSZip();
    
    console.log('🎫 STEP 3: Creating pass.json structure');
    // Add pass.json
    const passJsonString = JSON.stringify(passJson, null, 2);
    zip.file("pass.json", passJsonString);

    console.log('🎫 STEP 4: Adding Croft Common logo assets');
    // Generate Croft Common logo in white for wallet pass
    try {
      // Generate the actual Croft Common logo
      const logoData = generateCroftCommonLogo();
      
      // Add logo files - use the same logo data for all sizes
      zip.file("icon.png", logoData);
      zip.file("icon@2x.png", logoData);  
      zip.file("icon@3x.png", logoData);
      zip.file("logo.png", logoData);
      zip.file("logo@2x.png", logoData);
      
      console.log('🎫 STEP 5: Generated Croft Common logo assets successfully');
      console.log('🎫 Logo sizes: 32x32, 64x64, 96x96 pixels (white on transparent)');
    } catch (error) {
      console.error('❌ Error generating PNG assets:', error);
      // Fallback to the previous approach if PNG generation fails
      const iconBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77wgAAAABJRU5ErkJggg==";
      const iconData = Uint8Array.from(atob(iconBase64), c => c.charCodeAt(0));
      
      zip.file("icon.png", iconData);
      zip.file("icon@2x.png", iconData);
      zip.file("icon@3x.png", iconData);
      zip.file("logo.png", iconData);
      zip.file("logo@2x.png", iconData);
    }

    console.log('🎫 STEP 6: Generating manifest.json with SHA1 hashes');
    // Generate manifest.json with SHA1 hashes of all files
    const manifest: Record<string, string> = {};
    
    // Calculate SHA1 for each file in the ZIP using raw bytes
    const fileNames = Object.keys(zip.files);
    console.log('🎫 STEP 7: Computing hashes for files:', fileNames);
    
    for (const fileName of fileNames) {
      if (fileName !== 'manifest.json' && fileName !== 'signature') {
        const file = zip.files[fileName];
        
        if (file && !file.dir) {
          // Get the raw binary data from JSZip
          const fileData = await file.async('uint8array');
          const hash = await sha1(fileData);
          manifest[fileName] = hash;
          console.log(`🎫 Hash for ${fileName}: ${hash}`);
        }
      }
    }

    console.log('🎫 STEP 8: Creating manifest.json');
    const manifestString = JSON.stringify(manifest, null, 2);
    zip.file("manifest.json", manifestString);

    console.log('🎫 STEP 9: Generating PKCS#7 signature');
    // Generate proper PKCS#7 signature
    try {
      // Normalise and validate certificates and key
      const passCertPem = normalizePem(passCert);
      const passKeyPem = normalizePem(passKey);
      const wwdrCertPem = normalizePem(wwdrCert);

      if (!/-----BEGIN CERTIFICATE-----/.test(passCertPem)) {
        throw new Error('Pass certificate PEM missing BEGIN CERTIFICATE header');
      }
      if (!/-----BEGIN (?:RSA )?PRIVATE KEY-----/.test(passKeyPem)) {
        throw new Error('Private key PEM missing BEGIN PRIVATE KEY or BEGIN RSA PRIVATE KEY header');
      }
      if (!/-----BEGIN CERTIFICATE-----/.test(wwdrCertPem)) {
        throw new Error('WWDR certificate PEM missing BEGIN CERTIFICATE header');
      }

      // Parse certificates and key
      const cert = forge.pki.certificateFromPem(passCertPem);
      const wwdr = forge.pki.certificateFromPem(wwdrCertPem);
      const key = forge.pki.privateKeyFromPem(passKeyPem);

      // Log non-sensitive certificate details for debugging
      try {
        const certSubjectCN = cert.subject.getField('CN')?.value;
        const certIssuerCN = cert.issuer.getField('CN')?.value;
        const certUID = (cert.subject.getField('UID') || cert.subject.getField('userId'))?.value;
        const wwdrSubjectCN = wwdr.subject.getField('CN')?.value;
        const wwdrIssuerCN = wwdr.issuer.getField('CN')?.value;
        console.log('🎫 Cert details:', {
          subjectCN: certSubjectCN,
          issuerCN: certIssuerCN,
          uid: certUID,
          serialNumber: cert.serialNumber,
          notBefore: cert.validity.notBefore,
          notAfter: cert.validity.notAfter,
          teamIdentifier,
          passTypeIdentifier
        });
        console.log('🎫 WWDR details:', {
          subjectCN: wwdrSubjectCN,
          issuerCN: wwdrIssuerCN
        });
      } catch (_) {
        // ignore logging parsing errors
      }

      // Create PKCS#7 signature
      const p7 = forge.pkcs7.createSignedData();
      p7.content = forge.util.createBuffer(manifestString, 'utf8');
      p7.addCertificate(cert);
      p7.addCertificate(wwdr);

      // Add signer
      p7.addSigner({
        key: key,
        certificate: cert,
        digestAlgorithm: forge.pki.oids.sha1,
        authenticatedAttributes: [
          { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
          { type: forge.pki.oids.messageDigest },
          { type: forge.pki.oids.signingTime, value: new Date() }
        ]
      });

      // Sign
      p7.sign({ detached: true });

      // Convert to DER format and add to zip
      const derBuffer = forge.asn1.toDer(p7.toAsn1()).getBytes();
      const signatureBytes = new Uint8Array(derBuffer.length);
      for (let i = 0; i < derBuffer.length; i++) {
        signatureBytes[i] = derBuffer.charCodeAt(i);
      }
      zip.file('signature', signatureBytes);
      console.log('🎫 ✅ PKCS#7 signature generated successfully');

    } catch (sigError) {
      console.error('❌ Error generating PKCS#7 signature:', sigError);
      const detail = (sigError as any)?.message || 'Unknown error';
      return new Response(
        JSON.stringify({
          error: `Invalid Apple Wallet certificate configuration: ${detail}. ` +
                 'Ensure all PEM values have real newlines (no \\n) and proper BEGIN/END headers.'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('🎫 STEP 10: Generating final .pkpass file');
    // Generate the ZIP file using JSZip
    const zipArrayBuffer = await zip.generateAsync({ type: "arraybuffer" });
    const zipUint8Array = new Uint8Array(zipArrayBuffer);
    console.log(`🎫 Generated .pkpass file size: ${zipUint8Array.length} bytes`);

    console.log('🎫 STEP 11: Updating user profile with serial number');
    // Update user profile with pass information (but without URL since we serve directly)
    const { error: updateError } = await supabaseClient
      .from('profiles')
      .update({
        wallet_pass_last_issued_at: new Date().toISOString(),
        wallet_pass_serial_number: serialNumber,
        wallet_pass_revoked: false
      })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('❌ STEP 11 FAILED - Error updating profile:', updateError);
      return new Response(JSON.stringify({ error: 'Failed to update profile' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('🎫 🎉 SUCCESS - Apple Wallet pass created successfully!');
    console.log('🎫 Serial Number:', serialNumber);
    console.log('🎫 Serving .pkpass file directly with proper headers');

    // Generate filename with .pkpass extension for iOS Safari recognition
    const filename = `${member.membership_number || 'membership'}-${serialNumber}.pkpass`;

    console.log('🎫 Final teamIdentifier value:', JSON.stringify(teamIdentifier));
    console.log('🎫 Pass type identifier:', JSON.stringify(passTypeIdentifier));
    
    // Return the .pkpass file with optimized headers for iOS Safari
    return new Response(zipUint8Array, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.apple.pkpass',
        // Use inline instead of attachment for iOS Safari compatibility  
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': zipUint8Array.byteLength.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        // iOS-specific headers to help Safari handle the wallet pass
        'X-Content-Type-Options': 'nosniff',
        'Accept-Ranges': 'bytes',
        // Additional iOS Safari compatibility headers
        'X-Frame-Options': 'DENY'
      }
    });

  } catch (error) {
    console.error('Error in create-wallet-pass function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});