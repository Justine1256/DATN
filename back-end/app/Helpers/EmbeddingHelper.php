<?php

namespace App\Helpers;

class EmbeddingHelper
{
    public static function cosineSimilarity(array $a, array $b): float
    {
        $dotProduct = 0.0;
        $normA = 0.0;
        $normB = 0.0;

        foreach ($a as $i => $val) {
            $dotProduct += $val * $b[$i];
            $normA += $val ** 2;
            $normB += $b[$i] ** 2;
        }

        return $dotProduct / (sqrt($normA) * sqrt($normB));
    }
}
