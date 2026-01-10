class AccountService {
  static async signup(
    email: string,
    password: string,
    password_repeat: string,
    name?: string,
  ): Promise<any> {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mail: email,
          password: password,
          password_repeat: password_repeat,
          name: name,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      return { success: true, ...data };
    }
    catch (error) {
      console.error("[AccountService] Signup error:", error);
      return { success: false, error: error instanceof Error ? error.message : 'Registration failed' };
    }
  }
}

export default AccountService;
