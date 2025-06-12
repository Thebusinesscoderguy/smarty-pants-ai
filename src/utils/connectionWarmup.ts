
import { supabase } from '@/integrations/supabase/client';

export class ConnectionWarmup {
  private static isWarmedUp = false;
  private static warmupPromise: Promise<void> | null = null;

  static async warmupConnection(): Promise<void> {
    if (this.isWarmedUp || this.warmupPromise) {
      return this.warmupPromise || Promise.resolve();
    }

    console.log('🔥 Warming up Supabase connection...');
    
    this.warmupPromise = this.performWarmup();
    
    try {
      await this.warmupPromise;
      this.isWarmedUp = true;
      console.log('✅ Connection warmup completed');
    } catch (error) {
      console.warn('⚠️ Connection warmup failed:', error);
      // Don't throw - warmup failure shouldn't block the app
    }
    
    return this.warmupPromise;
  }

  private static async performWarmup(): Promise<void> {
    const warmupTasks = [
      // Test auth session
      this.warmupAuth(),
      // Test database connection with simple query
      this.warmupDatabase(),
      // Pre-resolve DNS if possible
      this.warmupDNS()
    ];

    // Run warmup tasks with timeout
    await Promise.race([
      Promise.allSettled(warmupTasks),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Warmup timeout')), 5000)
      )
    ]);
  }

  private static async warmupAuth(): Promise<void> {
    try {
      await supabase.auth.getSession();
    } catch (error) {
      console.warn('Auth warmup failed:', error);
    }
  }

  private static async warmupDatabase(): Promise<void> {
    try {
      // Simple query to establish connection
      await supabase
        .from('subjects')
        .select('id')
        .limit(1)
        .maybeSingle();
    } catch (error) {
      console.warn('Database warmup failed:', error);
    }
  }

  private static async warmupDNS(): Promise<void> {
    try {
      // Pre-resolve DNS for Supabase endpoint
      const supabaseUrl = 'https://twfzlbockonxopuindaw.supabase.co';
      await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        cache: 'no-cache'
      });
    } catch (error) {
      console.warn('DNS warmup failed:', error);
    }
  }

  static reset(): void {
    this.isWarmedUp = false;
    this.warmupPromise = null;
  }
}
