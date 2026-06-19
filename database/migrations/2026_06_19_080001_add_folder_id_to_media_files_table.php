<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->foreignId('folder_id')
                  ->nullable()
                  ->after('id')
                  ->constrained('media_folders')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('media_files', function (Blueprint $table) {
            $table->dropForeignIdFor(\App\Models\MediaFolder::class, 'folder_id');
            $table->dropColumn('folder_id');
        });
    }
};
