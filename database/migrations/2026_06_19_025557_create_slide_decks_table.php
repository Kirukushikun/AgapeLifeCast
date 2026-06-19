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
        Schema::create('slide_decks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('disk_path');
            $table->string('mime_type', 100);
            $table->string('extension', 10);        // pptx, ppt, pdf, key
            $table->unsignedSmallInteger('slide_count')->default(0);
            $table->unsignedBigInteger('size')->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('slide_decks');
    }
};
