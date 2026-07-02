<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;
use Illuminate\Support\Facades\Crypt;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            // Company
            ['key' => 'company_name', 'value' => 'ASG Trading', 'type' => 'string', 'group' => 'Company', 'is_public' => true, 'description' => 'Official company name.'],
            ['key' => 'company_address', 'value' => 'Dubai, UAE', 'type' => 'string', 'group' => 'Company', 'is_public' => true, 'description' => 'Official company address.'],
            ['key' => 'company_phone', 'value' => '+971501234567', 'type' => 'string', 'group' => 'Company', 'is_public' => true, 'description' => 'Main contact number.'],
            ['key' => 'company_email', 'value' => 'contact@asg-trading.com', 'type' => 'string', 'group' => 'Company', 'is_public' => true, 'description' => 'Main contact email.'],
            ['key' => 'company_logo', 'value' => null, 'type' => 'file', 'group' => 'Company', 'is_public' => true, 'description' => 'URL or path to company logo.'],
            ['key' => 'company_trn', 'value' => '100123456789', 'type' => 'string', 'group' => 'Company', 'is_public' => true, 'description' => 'Tax Registration Number.'],
            
            // Prefixes
            ['key' => 'booking_prefix', 'value' => 'BKG-', 'type' => 'string', 'group' => 'Booking', 'is_public' => true, 'description' => 'Prefix for Booking IDs.'],
            ['key' => 'payment_prefix', 'value' => 'PAY-', 'type' => 'string', 'group' => 'Payment', 'is_public' => true, 'description' => 'Prefix for Payment IDs.'],
            ['key' => 'ledger_prefix', 'value' => 'LED-', 'type' => 'string', 'group' => 'Ledger', 'is_public' => true, 'description' => 'Prefix for Ledger IDs.'],
            ['key' => 'expense_prefix', 'value' => 'EXP-', 'type' => 'string', 'group' => 'Expense', 'is_public' => true, 'description' => 'Prefix for Expense IDs.'],
            ['key' => 'invoice_prefix', 'value' => 'INV-', 'type' => 'string', 'group' => 'Invoice', 'is_public' => true, 'description' => 'Prefix for Invoice numbers.'],
            
            // System
            ['key' => 'currency', 'value' => 'AED', 'type' => 'string', 'group' => 'Currency', 'is_public' => true, 'description' => 'Default system currency code.'],
            ['key' => 'currency_symbol', 'value' => 'د.إ', 'type' => 'string', 'group' => 'Currency', 'is_public' => true, 'description' => 'Default system currency symbol.'],
            ['key' => 'timezone', 'value' => 'Asia/Dubai', 'type' => 'string', 'group' => 'System', 'is_public' => true, 'description' => 'Default system timezone.'],
            ['key' => 'date_format', 'value' => 'Y-m-d', 'type' => 'string', 'group' => 'System', 'is_public' => true, 'description' => 'Default date format.'],
            ['key' => 'decimal_places', 'value' => '2', 'type' => 'integer', 'group' => 'System', 'is_public' => true, 'description' => 'Number of decimal places for amounts.'],
            ['key' => 'default_shop', 'value' => '1', 'type' => 'integer', 'group' => 'System', 'is_public' => false, 'description' => 'Default shop ID for new records if applicable.'],
            ['key' => 'default_payment_method', 'value' => '1', 'type' => 'integer', 'group' => 'Payment', 'is_public' => false, 'description' => 'Default payment method ID.'],
            
            // Email (Sensitive)
            ['key' => 'smtp_host', 'value' => 'smtp.mailtrap.io', 'type' => 'string', 'group' => 'Email', 'is_public' => false, 'description' => 'SMTP Host address.'],
            ['key' => 'smtp_port', 'value' => '2525', 'type' => 'integer', 'group' => 'Email', 'is_public' => false, 'description' => 'SMTP Port.'],
            ['key' => 'smtp_username', 'value' => 'user123', 'type' => 'string', 'group' => 'Email', 'is_public' => false, 'description' => 'SMTP Username.'],
            ['key' => 'smtp_password', 'value' => Crypt::encryptString('secretpassword'), 'type' => 'encrypted', 'group' => 'Email', 'is_public' => false, 'description' => 'SMTP Password (Encrypted).'],
            
            // SMS & General
            ['key' => 'sms_provider', 'value' => 'twilio', 'type' => 'string', 'group' => 'SMS', 'is_public' => false, 'description' => 'Active SMS provider.'],
            ['key' => 'notification_enabled', 'value' => '1', 'type' => 'boolean', 'group' => 'Notification', 'is_public' => false, 'description' => 'Enable or disable system notifications.'],
            ['key' => 'backup_retention_days', 'value' => '30', 'type' => 'integer', 'group' => 'Backup', 'is_public' => false, 'description' => 'Number of days to keep database backups.'],
            ['key' => 'vat_percentage', 'value' => '5.00', 'type' => 'decimal', 'group' => 'Tax', 'is_public' => true, 'description' => 'Standard VAT percentage.'],
            ['key' => 'receipt_footer', 'value' => 'Thank you for your business!', 'type' => 'text', 'group' => 'Printing', 'is_public' => true, 'description' => 'Text displayed at the bottom of receipts.'],
            ['key' => 'terms_conditions', 'value' => 'Standard terms apply. No refunds after 7 days.', 'type' => 'text', 'group' => 'General', 'is_public' => true, 'description' => 'General terms and conditions.'],
        ];

        foreach ($settings as $setting) {
            Setting::firstOrCreate(
                ['key' => $setting['key']],
                $setting
            );
        }
    }
}
