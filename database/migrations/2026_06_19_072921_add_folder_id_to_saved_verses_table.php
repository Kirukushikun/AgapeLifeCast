<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('saved_verses', function (Blueprint $table) {
            // Column may already exist if a previous migration attempt left it orphaned.
            if (!\Schema::hasColumn('saved_verses', 'folder_id')) {
                $table->foreignId('folder_id')->nullable()->after('id')
                      ->constrained('verse_folders')->nullOnDelete();
            } else {
                $table->foreign('folder_id')->references('id')->on('verse_folders')->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('saved_verses', function (Blueprint $table) {
            $table->dropForeign(['folder_id']);
            $table->dropColumn('folder_id');
        });
    }
};
