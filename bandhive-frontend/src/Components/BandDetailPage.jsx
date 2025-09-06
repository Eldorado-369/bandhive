import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import api from "../api";
import { Typography, Box, Grid, Paper } from "@mui/material";

const BandDetailPage = () => {
  const { bandId } = useParams();
  const [bandData, setBandData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBandDetails = async () => {
      try {
        const res = await api.get(`/band-details/${bandId}/`); 
        console.log("Band Details:", res.data);
        setBandData(res.data);
      } catch (error) {
        console.error("Error fetching band details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBandDetails();
  }, [bandId]);

  if (loading) return <Typography>Loading...</Typography>;
  if (!bandData) return <Typography>Band not found.</Typography>;

  return (
    <Paper elevation={3} style={{ margin: "20px", padding: "20px" }}>
      <Typography variant="h4">{bandData.name}</Typography>
      <Typography variant="subtitle1">Genre: {bandData.genre}</Typography>
      <Typography variant="body1">Location: {bandData.location}</Typography>
      <Typography variant="body1">
        Base Price: ₹{bandData.base_price}
      </Typography>
      <Typography variant="body2">{bandData.description}</Typography>

      <Box mt={4}>
        <Typography variant="h6">Band Members</Typography>
        {bandData.members && bandData.members.length > 0 ? (
          bandData.members.map((member) => (
            <Typography key={member.id}>
              {member.name} - {member.role}
            </Typography>
          ))
        ) : (
          <Typography>No members found.</Typography>
        )}
      </Box>

      <Box mt={4}>
        <Typography variant="h6">Gallery</Typography>

        {bandData.portfolio.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.id}>
            <Paper elevation={2} style={{ padding: "10px" }}>
              <Typography variant="subtitle1">{item.title}</Typography>
              {item.images.map((img) => (
                <img
                  key={img.id}
                  src={img.image}
                  alt={item.title}
                  style={{
                    width: "100%",
                    maxHeight: "200px",
                    objectFit: "cover",
                    marginBottom: "10px",
                  }}
                />
              ))}
              {item.video_url && (
                <a href={item.video_url} target="_blank">
                  {item.video_url}
                </a>
              )}
            </Paper>
          </Grid>
        ))}
        
        {bandData.portfolio && bandData.portfolio.length > 0 ? (
          <Grid container spacing={2}>
            {bandData.portfolio.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.id}>
                <Paper elevation={2} style={{ padding: "10px" }}>
                  <Typography variant="subtitle1">{item.title}</Typography>
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.title}
                      style={{
                        width: "100%",
                        maxHeight: "200px",
                        objectFit: "cover",
                      }}
                    />
                  )}
                  {item.video_url && (
                    <Box mt={1}>
                      <Typography variant="body2">
                        Video:{" "}
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {item.video_url}
                        </a>
                      </Typography>
                    </Box>
                  )}
                  <Typography variant="body2">{item.description}</Typography>
                  <Typography variant="caption">
                    Featured: {item.is_featured ? "Yes" : "No"}
                  </Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography>No gallery items available.</Typography>
        )}
      </Box>
    </Paper>
  );
};

export default BandDetailPage;
