// Get all users with Google credentials and email tagging enabled
const { data: users, error } = await supabase
  .from("users")
  .select("id")
  .not("google_refresh_token", "is", null)
  .eq("email_tagging_enabled", true);

if (error) {
  throw new Error(`Failed to fetch users: ${error.message}`);
}

if (!users || users.length === 0) {
  return NextResponse.json({
    success: true,
    message: "No users with enabled email tagging found",
    processedUsers: 0,
    results: []
  });
} 